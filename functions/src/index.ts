/**
 * Cloud Functions — PESV Interactivo
 *
 * Asignación de custom claims y operaciones reservadas al superadministrador.
 *
 * Los claims (`nit`, `rol`) son lo que autoriza el acceso a Cloud Storage y lo
 * que la interfaz consulta para saber qué mostrar. Solo el Admin SDK puede
 * escribirlos: a diferencia de displayName, el cliente no puede alterarlos.
 *
 * Crear usuarios también vive aquí por una razón práctica: desde el SDK de
 * cliente, crear una cuenta cambia la sesión activa, así que el panel de
 * administración expulsaría al propio superadministrador.
 */

import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError, CallableRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

initializeApp();

setGlobalOptions({maxInstances: 10});

/**
 * Correos con acceso de superadministrador.
 *
 * Deliberadamente vive aquí y no en Firestore: el rol de un usuario normal se
 * lee de users/{uid}, documento que el propio usuario puede editar desde su
 * perfil. Si el superadmin saliera de ahí, cualquiera podría ascenderse solo.
 * Cambiar esta lista exige desplegar, que es justo la fricción que se busca.
 */
const SUPERADMINS: string[] = [
  "superadmin@pesvinteractivo.com",
];

/**
 * ¿El correo pertenece a un superadministrador?
 *
 * @param {string|undefined} email Correo del token de la petición.
 * @return {boolean} true si está en la lista blanca.
 */
function esSuperadmin(email: string | undefined): boolean {
  if (!email) return false;
  return SUPERADMINS.includes(email.toLowerCase());
}

/**
 * Exige que la petición venga de una sesión iniciada.
 *
 * @param {CallableRequest} request Petición recibida por la función.
 * @return {string} uid del usuario autenticado.
 */
function exigirSesion(request: CallableRequest): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "Debes iniciar sesión para continuar."
    );
  }
  return uid;
}

/**
 * Exige que quien llama sea superadministrador.
 *
 * Se valida contra la lista blanca y no contra el claim, para que revocar el
 * acceso surta efecto sin esperar a que caduque el token del interesado.
 *
 * @param {CallableRequest} request Petición recibida por la función.
 */
function exigirSuperadmin(request: CallableRequest): void {
  exigirSesion(request);
  if (!esSuperadmin(request.auth?.token?.email)) {
    throw new HttpsError(
      "permission-denied",
      "No tienes permiso para esta operación."
    );
  }
}

/**
 * Lee un campo de texto obligatorio del cuerpo de la petición.
 *
 * @param {unknown} valor Valor recibido.
 * @param {string} nombre Nombre del campo, para el mensaje de error.
 * @return {string} El valor recortado.
 */
function textoObligatorio(valor: unknown, nombre: string): string {
  if (typeof valor !== "string" || valor.trim() === "") {
    throw new HttpsError(
      "invalid-argument",
      `El campo ${nombre} es obligatorio.`
    );
  }
  return valor.trim();
}

/**
 * Traduce los errores de Auth a mensajes que el panel pueda mostrar.
 *
 * @param {unknown} error Error lanzado por el Admin SDK.
 * @throws {HttpsError} Siempre: traduce el error y lo relanza.
 */
function fallarCreacion(error: unknown): never {
  const codigo = (error as {code?: string}).code;

  if (codigo === "auth/email-already-exists") {
    throw new HttpsError(
      "already-exists",
      "Ya existe una cuenta con ese correo."
    );
  }
  if (codigo === "auth/invalid-password") {
    throw new HttpsError(
      "invalid-argument",
      "La contraseña debe tener al menos 6 caracteres."
    );
  }
  if (codigo === "auth/invalid-email") {
    throw new HttpsError("invalid-argument", "El correo no es válido.");
  }

  logger.error("Error creando la cuenta", {error});
  throw new HttpsError("internal", "No se pudo crear la cuenta.");
}

/**
 * Asigna los custom claims del usuario autenticado.
 *
 * Para un superadministrador basta el rol: no pertenece a ninguna empresa.
 * Para el resto, el NIT se lee de users/{uid} y nunca del cuerpo de la
 * petición: si viniera del cliente, cualquiera podría reclamar el NIT ajeno.
 *
 * El rol admitido aquí es solo "supervisor" u "operativo". "superadmin" jamás
 * se concede desde el documento del usuario, por la razón explicada arriba.
 */
export const asignarClaimNit = onCall({invoker: "public"}, async (request) => {
  const uid = exigirSesion(request);
  const email = request.auth?.token?.email;

  if (esSuperadmin(email)) {
    await getAuth().setCustomUserClaims(uid, {rol: "superadmin"});
    logger.info("Claim superadmin asignado", {uid, email});
    return {rol: "superadmin"};
  }

  const snap = await getFirestore().doc(`users/${uid}`).get();
  const datos = snap.data() as {
    nitEmpresa?: unknown;
    rol?: unknown;
  } | undefined;
  const nit = datos?.nitEmpresa;

  if (typeof nit !== "string" || nit.trim() === "") {
    throw new HttpsError(
      "failed-precondition",
      "La cuenta no tiene un NIT registrado."
    );
  }

  const rol = datos?.rol === "supervisor" ? "supervisor" : "operativo";

  await getAuth().setCustomUserClaims(uid, {nit, rol});
  logger.info("Claims asignados", {uid, nit, rol});

  return {nit, rol};
});

/**
 * Devuelve los usuarios registrados. Reservada al superadministrador.
 *
 * Combina el documento de users/{uid} con el estado real de la cuenta en
 * Authentication (último acceso, si está deshabilitada), que Firestore no
 * conoce.
 */
export const listarUsuarios = onCall({invoker: "public"}, async (request) => {
  exigirSuperadmin(request);

  const snap = await getFirestore().collection("users").get();

  const usuarios = await Promise.all(snap.docs.map(async (doc) => {
    const d = doc.data();
    let ultimoAcceso: string | null = null;
    let deshabilitado = false;
    let emailAuth: string | null = null;

    try {
      const cuenta = await getAuth().getUser(doc.id);
      ultimoAcceso = cuenta.metadata.lastSignInTime ?? null;
      deshabilitado = cuenta.disabled;
      emailAuth = cuenta.email ?? null;
    } catch (error) {
      // El documento existe pero la cuenta de Auth no: pasa si se borró la
      // cuenta sin limpiar Firestore. Se muestra igual, marcado como huérfano.
      logger.warn("Usuario sin cuenta en Auth", {uid: doc.id});
    }

    return {
      uid: doc.id,
      nombreCompleto: d["nombreCompleto"] ?? "",
      email: emailAuth ?? d["email"] ?? "",
      nombreEmpresa: d["nombreEmpresa"] ?? "",
      nitEmpresa: d["nitEmpresa"] ?? "",
      rol: d["rol"] === "supervisor" ? "supervisor" : "operativo",
      nivelAcceso: d["nivelAcceso"] ?? "",
      telefono: d["telefono"] ?? "",
      cargoEmpresa: d["cargoEmpresa"] ?? "",
      ultimoAcceso,
      deshabilitado,
      sinCuenta: emailAuth === null,
    };
  }));

  logger.info("Usuarios consultados", {total: usuarios.length});

  return {usuarios};
});

/**
 * Crea el usuario operativo de una empresa nueva.
 *
 * Deja `nivelAcceso: "no"` a propósito: el operativo pasará por el
 * cuestionario inicial, que es quien calcula el nivel del PESV según su flota
 * y su actividad, y quien crea allí el progreso y los programas base.
 */
export const crearUsuarioEmpresa = onCall(
  {invoker: "public"},
  async (request) => {
    exigirSuperadmin(request);

    const d = request.data ?? {};
    const email = textoObligatorio(d.email, "correo").toLowerCase();
    const password = textoObligatorio(d.password, "contraseña");
    const nitEmpresa = textoObligatorio(d.nitEmpresa, "NIT");
    const nombreEmpresa = textoObligatorio(d.nombreEmpresa, "empresa");
    const nombreCompleto = textoObligatorio(d.nombreCompleto, "nombre");

    if (/\s/.test(nitEmpresa)) {
      throw new HttpsError(
        "invalid-argument",
        "El NIT no puede contener espacios: forma parte de la ruta de datos."
      );
    }

    const db = getFirestore();

    // Un NIT repetido significaria dos empresas compartiendo los mismos
    // documentos, porque el NIT es la raiz de sus datos.
    const existentes = await db.collection("users")
      .where("nitEmpresa", "==", nitEmpresa).limit(1).get();
    if (!existentes.empty) {
      throw new HttpsError(
        "already-exists",
        "Ya hay una empresa registrada con ese NIT."
      );
    }

    let uid: string;
    try {
      // Sin photoURL: el proyecto usa ese campo para el nombre de la
      // empresa, pero el Admin SDK lo valida como URL y lo rechaza. Lo
      // rellena el cliente en el primer inicio de sesion, leyendolo de
      // users/{uid}, porque el SDK web no aplica esa validacion.
      const cuenta = await getAuth().createUser({
        email,
        password,
        displayName: nitEmpresa,
      });
      uid = cuenta.uid;
    } catch (error) {
      fallarCreacion(error);
    }

    const perfil = {
      uid,
      email,
      nombreCompleto,
      nombreEmpresa,
      nitEmpresa,
      cargoEmpresa: typeof d.cargoEmpresa === "string" ? d.cargoEmpresa : "",
      telefono: typeof d.telefono === "string" ? d.telefono : "",
      rol: "operativo",
      nivelAcceso: "no",
      estado: "Activo",
      docCreado: FieldValue.serverTimestamp(),
    };

    await db.doc(`users/${uid}`).set(perfil);
    await db.doc(`Empresas/${nitEmpresa}`).set(perfil, {merge: true});

    logger.info("Operativo creado", {uid, nitEmpresa});

    return {uid, email, nitEmpresa};
  }
);

/**
 * Crea un supervisor sobre una empresa existente.
 *
 * Hereda el NIT y el nivel del operativo para que vea sus mismos datos y no
 * lo intercepte el cuestionario inicial. No toca Empresas/{nit} ni los
 * programas: la empresa ya existe y sobrescribirla borraria su trabajo.
 */
export const crearSupervisor = onCall(
  {invoker: "public"},
  async (request) => {
    exigirSuperadmin(request);

    const d = request.data ?? {};
    const email = textoObligatorio(d.email, "correo").toLowerCase();
    const password = textoObligatorio(d.password, "contraseña");
    const nitEmpresa = textoObligatorio(d.nitEmpresa, "NIT");
    const nombreCompleto = textoObligatorio(d.nombreCompleto, "nombre");

    const db = getFirestore();

    // El supervisor se cuelga de una empresa que ya existe: se toman de su
    // operativo el nombre y el nivel, para no pedirlos otra vez ni arriesgar
    // que queden distintos.
    const empresa = await db.collection("users")
      .where("nitEmpresa", "==", nitEmpresa)
      .where("rol", "in", ["operativo", "empresa"])
      .limit(1).get();

    if (empresa.empty) {
      throw new HttpsError(
        "not-found",
        "No hay ninguna empresa registrada con ese NIT."
      );
    }

    const datosEmpresa = empresa.docs[0].data();
    const nombreEmpresa = datosEmpresa["nombreEmpresa"] ?? "";
    const nivelAcceso = datosEmpresa["nivelAcceso"] ?? "no";

    let uid: string;
    try {
      // Sin photoURL: el proyecto usa ese campo para el nombre de la
      // empresa, pero el Admin SDK lo valida como URL y lo rechaza. Lo
      // rellena el cliente en el primer inicio de sesion, leyendolo de
      // users/{uid}, porque el SDK web no aplica esa validacion.
      const cuenta = await getAuth().createUser({
        email,
        password,
        displayName: nitEmpresa,
      });
      uid = cuenta.uid;
    } catch (error) {
      fallarCreacion(error);
    }

    await db.doc(`users/${uid}`).set({
      uid,
      email,
      nombreCompleto,
      nombreEmpresa,
      nitEmpresa,
      cargoEmpresa: typeof d.cargoEmpresa === "string" ? d.cargoEmpresa : "",
      telefono: typeof d.telefono === "string" ? d.telefono : "",
      rol: "supervisor",
      nivelAcceso,
      estado: "Activo",
      docCreado: FieldValue.serverTimestamp(),
    });

    logger.info("Supervisor creado", {uid, nitEmpresa});

    return {uid, email, nitEmpresa, nombreEmpresa};
  }
);

import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal } from "@angular/core";
import { IndexNavbarComponent } from "../../components/navbars/index-navbar/index-navbar.component";
import { Router, RouterLink } from "@angular/router";
import { FooterComponent } from "../../components/footers/footer/footer.component";
import { CommonModule } from '@angular/common';

interface NavigationLink {
  href: string
  label: string
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

interface FooterLink {
  label: string
  href: string
}

interface SocialLink {
  name: string
  href: string
  icon: string
  ariaLabel: string
}

@Component({
  selector: "app-index",
  standalone: true,
  imports: [CommonModule,IndexNavbarComponent,RouterLink,FooterComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./index.component.html",
})
export class IndexComponent implements OnInit {

  private _router = inject(Router);

  constructor() {}

  ngOnInit(): void {}

  isMenuOpen = signal(false)

  navigationLinks: NavigationLink[] = [
    { href: "/productos", label: "Productos" },
    { href: "/soluciones", label: "Soluciones" },
    { href: "/recursos", label: "Recursos" },
    { href: "/contacto", label: "Contacto" },
  ]

  toggleMenu(): void {
    this.isMenuOpen.update((value) => !value)
  }

  closeMenu(): void {
    this.isMenuOpen.set(false)
  }

  onCtaClick(): void {
    console.log("CTA button clicked!")
    this._router.navigate(['/login']);
    // Aquí puedes agregar la lógica que necesites
  }

  newsletterEmail = ""
  isSubmittingNewsletter = signal(false)
  newsletterMessage = signal<{ type: "success" | "error"; text: string } | null>(null)

  currentYear = new Date().getFullYear()

  footerSections: FooterSection[] = [
    {
      title: "Productos",
      links: [
        { label: "Componentes UI", href: "/productos/componentes" },
        { label: "Templates", href: "/productos/templates" },
        { label: "Bloques", href: "/productos/bloques" },
        { label: "Iconos", href: "/productos/iconos" },
      ],
    },
    {
      title: "Recursos",
      links: [
        { label: "Documentación", href: "/docs" },
        { label: "Guías", href: "/guias" },
        { label: "Blog", href: "/blog" },
        { label: "Comunidad", href: "/comunidad" },
      ],
    },
    {
      title: "Empresa",
      links: [
        { label: "Acerca de", href: "/acerca" },
        { label: "Carreras", href: "/carreras" },
        { label: "Contacto", href: "/contacto" },
        { label: "Prensa", href: "/prensa" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacidad", href: "/privacidad" },
        { label: "Términos", href: "/terminos" },
        { label: "Cookies", href: "/cookies" },
        { label: "Licencias", href: "/licencias" },
      ],
    },
  ]

  socialLinks: SocialLink[] = [
    {
      name: "Twitter",
      href: "https://twitter.com/tailblocks",
      ariaLabel: "Síguenos en Twitter",
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
      </svg>`,
    },
    {
      name: "GitHub",
      href: "https://github.com/tailblocks",
      ariaLabel: "Ver nuestro código en GitHub",
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
      </svg>`,
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/tailblocks",
      ariaLabel: "Conéctate con nosotros en LinkedIn",
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path>
        <circle cx="4" cy="4" r="2"></circle>
      </svg>`,
    },
    {
      name: "Instagram",
      href: "https://instagram.com/tailblocks",
      ariaLabel: "Síguenos en Instagram",
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"></path>
      </svg>`,
    },
  ]

  async onNewsletterSubmit(): Promise<void> {
    if (!this.newsletterEmail.trim()) {
      this.newsletterMessage.set({
        type: "error",
        text: "Por favor ingresa un email válido",
      })
      return
    }

    this.isSubmittingNewsletter.set(true)
    this.newsletterMessage.set(null)

    try {
      // Simular llamada a API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      this.newsletterMessage.set({
        type: "success",
        text: "¡Gracias! Te has suscrito exitosamente.",
      })
      this.newsletterEmail = ""

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => {
        this.newsletterMessage.set(null)
      }, 5000)
    } catch (error) {
      this.newsletterMessage.set({
        type: "error",
        text: "Error al suscribirse. Inténtalo de nuevo.",
      })
    } finally {
      this.isSubmittingNewsletter.set(false)
    }
  }
}

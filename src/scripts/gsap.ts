import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };

const root = document.documentElement;
/** True quando JS è attivo, l'utente non ha richiesto movimento ridotto e nulla è andato storto. */
export const canAnimate = () => root.classList.contains('anim') && !root.classList.contains('anim-fail');
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isDesktop = () => matchMedia('(min-width: 900px)').matches;

/** Registra una funzione ScrollTrigger-aware che si ripulisce al cambio di media query. */
export const mm = gsap.matchMedia();

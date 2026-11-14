// Dice una frase de ayuda del contenido en el idioma que corresponde al avance del niño:
// en español, en inglés, o en 'mixto' primero en inglés y luego en español.
import type { PropsJuego } from '../tipos';
import { decir } from '../audio';

export function decirAyuda(props: Pick<PropsJuego, 'ayudas' | 'modo' | 'idiomaVoz' | 'vozHistoria'>, clave: string, alTerminar?: () => void) {
  const frase = props.ayudas[clave];
  if (!frase) {
    alTerminar?.();
    return;
  }
  if (props.modo === 'es') decir(frase.es, props.vozHistoria, alTerminar);
  else if (props.modo === 'en') decir(frase.en, props.idiomaVoz, alTerminar);
  else decir(frase.en, props.idiomaVoz, () => decir(frase.es, props.vozHistoria, alTerminar));
}

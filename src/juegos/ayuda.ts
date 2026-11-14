// Dice una frase de ayuda del contenido en el idioma que corresponde al avance del niño.
import type { PropsJuego } from '../tipos';
import { decir } from '../audio';

export function decirAyuda(props: Pick<PropsJuego, 'ayudas' | 'modo' | 'idiomaVoz' | 'vozHistoria'>, clave: string) {
  const frase = props.ayudas[clave];
  if (!frase) return;
  if (props.modo === 'es') decir(frase.es, props.vozHistoria);
  else decir(frase.en, props.idiomaVoz);
}

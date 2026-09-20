/** The entry screen: theme, the brand mark and the motif behind the hero. */

import { initTheme, bindTheme, paintMarks, cometField } from './shell.js';

initTheme();
paintMarks();
bindTheme(paintMarks);

const field = document.getElementById('cometfield');
if (field) field.replaceWith(cometField([{ x: -150, y: 40, rot: 51.7 }, { x: 40, y: 330, rot: 130.2 }]));

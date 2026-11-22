export interface ShapeDefinition {
  id: string
  title: string
  category: 'general' | 'basic' | 'flowchart' | 'arrows' | 'uml'
  width: number
  height: number
  style: string
  label?: string
  tags: string[]
  svgIcon: string
}

export interface ShapeCategory {
  id: 'general' | 'basic' | 'flowchart' | 'arrows' | 'uml'
  label: string
  icon: string
  open: boolean
}

export const CATEGORIES: ShapeCategory[] = [
  { id: 'general',   label: 'General',   icon: '▭', open: true },
  { id: 'basic',     label: 'Básicas',   icon: '◇', open: false },
  { id: 'flowchart', label: 'Flowchart', icon: '◆', open: false },
  { id: 'arrows',    label: 'Flechas',   icon: '→', open: false },
  { id: 'uml',       label: 'UML & ER',  icon: '⬢', open: false }
]

export const SHAPES: ShapeDefinition[] = [
  // ================= GENERAL =================
  {
    id: 'rectangle',
    title: 'Rectángulo',
    category: 'general',
    width: 120,
    height: 60,
    style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
    label: 'Rectángulo',
    tags: ['rect', 'rectangle', 'box', 'cuadrado', 'caja'],
    svgIcon: '<rect x="3" y="6" width="26" height="20" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'rounded-rect',
    title: 'Rectángulo Redondeado',
    category: 'general',
    width: 120,
    height: 60,
    style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
    label: 'Redondeado',
    tags: ['rounded', 'rect', 'box', 'suave'],
    svgIcon: '<rect x="3" y="6" width="26" height="20" rx="6" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'circle',
    title: 'Círculo / Elipse',
    category: 'general',
    width: 90,
    height: 90,
    style: 'shape=ellipse;perimeter=ellipsePerimeter;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#d5e8d4;strokeColor=#82b366;',
    label: 'Círculo',
    tags: ['circle', 'circulo', 'ellipse', 'elipse', 'oval', 'redondo'],
    svgIcon: '<circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'diamond',
    title: 'Rombo / Decisión',
    category: 'general',
    width: 90,
    height: 90,
    style: 'shape=rhombus;perimeter=rhombusPerimeter;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;',
    label: '¿Decisión?',
    tags: ['diamond', 'rhombus', 'rombo', 'decision', 'if', 'condicion'],
    svgIcon: '<polygon points="16,3 29,16 16,29 3,16" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'cylinder',
    title: 'Cilindro / BD',
    category: 'general',
    width: 80,
    height: 90,
    style: 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#e1d5e7;strokeColor=#9673a6;',
    label: 'Base de Datos',
    tags: ['cylinder', 'cilindro', 'database', 'db', 'bd', 'almacenamiento', 'storage'],
    svgIcon: '<path d="M6,8 C6,5 26,5 26,8 L26,24 C26,27 6,27 6,24 Z M6,8 C6,11 26,11 26,8" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'cloud',
    title: 'Nube',
    category: 'general',
    width: 120,
    height: 80,
    style: 'shape=cloud;perimeter=ellipsePerimeter;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;',
    label: 'Nube / Cloud',
    tags: ['cloud', 'nube', 'network', 'red', 'internet'],
    svgIcon: '<path d="M9,22 C5,22 4,17 7,15 C6,11 11,8 14,10 C16,6 23,7 24,11 C28,12 28,17 25,20 C24,22 21,22 19,22 Z" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'document',
    title: 'Documento',
    category: 'general',
    width: 110,
    height: 80,
    style: 'shape=document;whiteSpace=wrap;html=1;boundedLbl=1;fillColor=#fff2cc;strokeColor=#d6b656;',
    label: 'Documento',
    tags: ['document', 'documento', 'doc', 'file', 'archivo'],
    svgIcon: '<path d="M5,4 L27,4 L27,24 C22,21 16,28 5,23 Z" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'text-block',
    title: 'Texto Libre',
    category: 'general',
    width: 100,
    height: 40,
    style: 'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=14;',
    label: 'Texto',
    tags: ['text', 'texto', 'label', 'etiqueta', 'nota'],
    svgIcon: '<text x="16" y="22" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle" fill="currentColor">T</text>'
  },

  // ================= BÁSICAS =================
  {
    id: 'triangle',
    title: 'Triángulo',
    category: 'basic',
    width: 80,
    height: 90,
    style: 'shape=triangle;perimeter=trianglePerimeter;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;',
    label: 'Triángulo',
    tags: ['triangle', 'triangulo', 'delta'],
    svgIcon: '<polygon points="16,4 29,27 3,27" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'parallelogram',
    title: 'Paralelogramo',
    category: 'basic',
    width: 120,
    height: 60,
    style: 'shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
    label: 'Entrada / Salida',
    tags: ['parallelogram', 'paralelogramo', 'io', 'data'],
    svgIcon: '<polygon points="8,26 29,26 24,6 3,6" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'hexagon',
    title: 'Hexágono',
    category: 'basic',
    width: 110,
    height: 80,
    style: 'shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#d5e8d4;strokeColor=#82b366;',
    label: 'Preparación',
    tags: ['hexagon', 'hexagono', 'preparacion'],
    svgIcon: '<polygon points="8,6 24,6 30,16 24,26 8,26 2,16" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'cube',
    title: 'Cubo 3D',
    category: 'basic',
    width: 90,
    height: 90,
    style: 'shape=cube;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;darkOpacity=0.05;darkOpacity2=0.1;fillColor=#e1d5e7;strokeColor=#9673a6;',
    label: 'Cubo',
    tags: ['cube', 'cubo', '3d', 'volumen'],
    svgIcon: '<path d="M4,10 L16,4 L28,10 L28,24 L16,30 L4,24 Z M4,10 L16,16 L28,10 M16,16 L16,30" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'note',
    title: 'Nota Adhesiva',
    category: 'basic',
    width: 90,
    height: 90,
    style: 'shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;fillColor=#fff2cc;strokeColor=#d6b656;',
    label: 'Nota...',
    tags: ['note', 'nota', 'postit', 'recordatorio'],
    svgIcon: '<path d="M4,4 L22,4 L28,10 L28,28 L4,28 Z M22,4 L22,10 L28,10" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'callout',
    title: 'Bocadillo / Comentario',
    category: 'basic',
    width: 120,
    height: 80,
    style: 'shape=callout;whiteSpace=wrap;html=1;perimeter=calloutPerimeter;fillColor=#dae8fc;strokeColor=#6c8ebf;',
    label: 'Mensaje',
    tags: ['callout', 'speech', 'burbuja', 'dialogo', 'comentario'],
    svgIcon: '<path d="M4,6 C4,4 6,4 8,4 L24,4 C26,4 28,4 28,6 L28,20 C28,22 26,22 24,22 L14,22 L8,28 L8,22 L6,22 C4,22 4,20 4,18 Z" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },

  // ================= FLOWCHART =================
  {
    id: 'process',
    title: 'Proceso',
    category: 'flowchart',
    width: 120,
    height: 60,
    style: 'shape=process;whiteSpace=wrap;html=1;backgroundOutline=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
    label: 'Subproceso',
    tags: ['process', 'proceso', 'flowchart', 'flujo'],
    svgIcon: '<path d="M3,6 L29,6 L29,26 L3,26 Z M8,6 L8,26 M24,6 L24,26" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'flow-terminator',
    title: 'Inicio / Fin',
    category: 'flowchart',
    width: 110,
    height: 50,
    style: 'rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;',
    label: 'Inicio',
    tags: ['terminator', 'inicio', 'fin', 'start', 'end'],
    svgIcon: '<rect x="3" y="8" width="26" height="16" rx="8" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'flow-step',
    title: 'Paso / Flecha derecha',
    category: 'flowchart',
    width: 120,
    height: 60,
    style: 'shape=step;perimeter=stepPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#ffe6cc;strokeColor=#d79b00;',
    label: 'Paso',
    tags: ['step', 'paso', 'chevron', 'etapa'],
    svgIcon: '<polygon points="3,6 23,6 29,16 23,26 3,26 9,16" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'flow-tape',
    title: 'Cinta perforada',
    category: 'flowchart',
    width: 110,
    height: 70,
    style: 'shape=tape;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;',
    label: 'Cinta',
    tags: ['tape', 'cinta', 'almacenamiento'],
    svgIcon: '<path d="M3,6 L29,6 L29,23 C24,20 18,27 12,23 C8,21 5,25 3,23 Z" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },

  // ================= FLECHAS =================
  {
    id: 'arrow-right',
    title: 'Flecha Derecha',
    category: 'arrows',
    width: 100,
    height: 50,
    style: 'shape=flexArrow;endArrow=classic;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
    label: '',
    tags: ['arrow', 'flecha', 'derecha', 'right'],
    svgIcon: '<polygon points="3,12 18,12 18,6 29,16 18,26 18,20 3,20" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'arrow-left',
    title: 'Flecha Izquierda',
    category: 'arrows',
    width: 100,
    height: 50,
    style: 'shape=flexArrow;endArrow=classic;startArrow=none;html=1;direction=west;fillColor=#dae8fc;strokeColor=#6c8ebf;',
    label: '',
    tags: ['arrow', 'flecha', 'izquierda', 'left'],
    svgIcon: '<polygon points="29,12 14,12 14,6 3,16 14,26 14,20 29,20" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'arrow-bidirectional',
    title: 'Flecha Doble',
    category: 'arrows',
    width: 110,
    height: 50,
    style: 'shape=flexArrow;endArrow=classic;startArrow=classic;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;',
    label: '',
    tags: ['arrow', 'flecha', 'doble', 'bidirectional'],
    svgIcon: '<polygon points="9,6 3,16 9,26 9,20 23,20 23,26 29,16 23,6 23,12 9,12" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },

  // ================= UML & ER =================
  {
    id: 'uml-actor',
    title: 'Actor (UML)',
    category: 'uml',
    width: 40,
    height: 70,
    style: 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#dae8fc;strokeColor=#6c8ebf;',
    label: 'Usuario',
    tags: ['actor', 'user', 'persona', 'humano', 'stickman', 'uml'],
    svgIcon: '<circle cx="16" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16,12 L16,22 M8,16 L24,16 M10,28 L16,22 L22,28" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'uml-usecase',
    title: 'Caso de Uso',
    category: 'uml',
    width: 120,
    height: 70,
    style: 'shape=ellipse;perimeter=ellipsePerimeter;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;',
    label: 'Caso de Uso',
    tags: ['usecase', 'caso de uso', 'uml'],
    svgIcon: '<ellipse cx="16" cy="16" rx="13" ry="8" fill="none" stroke="currentColor" stroke-width="1.8"/>'
  },
  {
    id: 'uml-boundary',
    title: 'Límite del Sistema',
    category: 'uml',
    width: 180,
    height: 140,
    style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#666666;strokeWidth=2;dashed=1;verticalAlign=top;',
    label: 'Sistema',
    tags: ['boundary', 'sistema', 'contenedor', 'limite', 'uml'],
    svgIcon: '<rect x="3" y="4" width="26" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3,2"/>'
  }
]

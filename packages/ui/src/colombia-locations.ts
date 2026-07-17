/**
 * Colombian departments and municipalities for shipping address forms.
 *
 * Department names and city names match the official DIVIPOLA nomenclature
 * used by Skydropx (area_level1 = department, area_level2 = municipality).
 *
 * Source: DANE – División Político-Administrativa de Colombia (DIVIPOLA)
 */

export interface ColombiaLocation {
  department: string
  cities: string[]
}

export const COLOMBIA_LOCATIONS: ColombiaLocation[] = [
  {
    department: 'Amazonas',
    cities: ['Leticia', 'Puerto Nariño', 'El Encanto', 'La Chorrera', 'La Pedrera', 'Mirití-Paraná'],
  },
  {
    department: 'Antioquia',
    cities: [
      'Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Turbo', 'Caucasia',
      'Rionegro', 'Sabaneta', 'Copacabana', 'La Estrella', 'Caldas', 'Barbosa',
      'Girardota', 'Marinilla', 'El Carmen de Viboral', 'La Ceja', 'Guarne',
      'Andes', 'Jericó', 'Santa Fe de Antioquia', 'Puerto Berrío', 'Yarumal',
      'Chigorodó', 'Carepa', 'Necoclí', 'Montería', 'Segovia', 'Remedios',
      'Amagá', 'Fredonia', 'Titiribí', 'Concepción', 'Santo Domingo',
    ],
  },
  {
    department: 'Arauca',
    cities: ['Arauca', 'Saravena', 'Tame', 'Arauquita', 'Fortul', 'Puerto Rondón', 'Cravo Norte'],
  },
  {
    department: 'Atlántico',
    cities: [
      'Barranquilla', 'Soledad', 'Malambo', 'Sabanagrande', 'Puerto Colombia',
      'Galapa', 'Baranoa', 'Sabanalarga', 'Palmar de Varela', 'Ponedera',
      'Santo Tomás', 'Polonuevo', 'Juan de Acosta', 'Tubará', 'Usiacurí',
    ],
  },
  {
    department: 'Bogotá D.C.',
    cities: ['Bogotá'],
  },
  {
    department: 'Bolívar',
    cities: [
      'Cartagena', 'Magangué', 'El Carmen de Bolívar', 'Turbaco', 'Mompós',
      'Arjona', 'Simití', 'Achí', 'María la Baja', 'San Juan Nepomuceno',
      'San Jacinto', 'San Cristóbal', 'Mahates', 'Villanueva', 'Calamar',
    ],
  },
  {
    department: 'Boyacá',
    cities: [
      'Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa', 'Samacá',
      'Ramiriquí', 'Soatá', 'Barbosa', 'Güicán', 'Puerto Boyacá',
      'Villa de Leyva', 'Nobsa', 'Tibasosa', 'Monguí', 'Miraflores',
    ],
  },
  {
    department: 'Caldas',
    cities: [
      'Manizales', 'La Dorada', 'Riosucio', 'Villamaría', 'Chinchiná',
      'Salamina', 'Aguadas', 'Anserma', 'Supía', 'Neira', 'Pensilvania',
    ],
  },
  {
    department: 'Caquetá',
    cities: [
      'Florencia', 'San Vicente del Caguán', 'Puerto Rico', 'El Doncello',
      'Curillo', 'La Montañita', 'Albania', 'Morelia', 'Valparaíso',
    ],
  },
  {
    department: 'Casanare',
    cities: [
      'Yopal', 'Aguazul', 'Villanueva', 'Tauramena', 'Paz de Ariporo',
      'Pore', 'Trinidad', 'Monterrey', 'Sabanalarga', 'Orocué',
    ],
  },
  {
    department: 'Cauca',
    cities: [
      'Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Guapi',
      'Piendamó', 'Bolívar', 'Patía', 'Miranda', 'Corinto', 'Caloto',
      'Silvia', 'Timbío', 'Coconuco', 'El Bordo',
    ],
  },
  {
    department: 'Cesar',
    cities: [
      'Valledupar', 'Aguachica', 'Bosconia', 'Codazzi', 'La Paz',
      'San Alberto', 'Curumaní', 'Chimichagua', 'El Copey', 'Pelaya',
      'Pailitas', 'Gamarra', 'Tamalameque',
    ],
  },
  {
    department: 'Chocó',
    cities: [
      'Quibdó', 'Istmina', 'Condoto', 'Tadó', 'Riosucio', 'Bagadó',
      'Lloró', 'Nóvita', 'Nuquí', 'Bahía Solano',
    ],
  },
  {
    department: 'Córdoba',
    cities: [
      'Montería', 'Lorica', 'Sahagún', 'Cereté', 'Montelíbano',
      'Planeta Rica', 'Tierralta', 'Ayapel', 'San Antero', 'Chinú',
      'Ciénaga de Oro', 'La Apartada', 'San Pelayo', 'Cotorra',
    ],
  },
  {
    department: 'Cundinamarca',
    cities: [
      'Soacha', 'Facatativá', 'Zipaquirá', 'Chía', 'Fusagasugá',
      'Girardot', 'Mosquera', 'Madrid', 'Funza', 'Cajicá', 'Sopó',
      'La Calera', 'Tabio', 'Tenjo', 'Sibaté', 'Cota',
      'Tocancipá', 'Gachancipá', 'Nemocón', 'Ubaté', 'Villapinzón',
      'Guatavita', 'Chocontá', 'Suesca', 'Cogua', 'Subachoque',
      'El Rosal', 'Bojacá', 'Zipacón', 'La Mesa', 'Anapoima',
    ],
  },
  {
    department: 'Guainía',
    cities: ['Inírida', 'Barranco Minas', 'Cacahual', 'Pana Pana', 'Puerto Colombia'],
  },
  {
    department: 'Guaviare',
    cities: ['San José del Guaviare', 'Calamar', 'El Retorno', 'Miraflores'],
  },
  {
    department: 'Huila',
    cities: [
      'Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre',
      'Rivera', 'Palermo', 'Aipe', 'Hobo', 'Gigante', 'Tesalia',
      'Algeciras', 'Timaná', 'San Agustín', 'Isnos',
    ],
  },
  {
    department: 'La Guajira',
    cities: [
      'Riohacha', 'Maicao', 'Uribia', 'Fonseca', 'Barrancas',
      'Manaure', 'Dibulla', 'Albania', 'Villanueva', 'El Molino',
    ],
  },
  {
    department: 'Magdalena',
    cities: [
      'Santa Marta', 'Ciénaga', 'Fundación', 'Aracataca', 'El Banco',
      'Plato', 'Pivijay', 'Zona Bananera', 'Salamina', 'San Zenón',
    ],
  },
  {
    department: 'Meta',
    cities: [
      'Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'Cumaral',
      'Restrepo', 'San Martín', 'Castilla La Nueva', 'Puerto Gaitán',
      'La Macarena', 'Fuente de Oro',
    ],
  },
  {
    department: 'Nariño',
    cities: [
      'Pasto', 'Tumaco', 'Ipiales', 'Túquerres', 'La Unión',
      'Samaniego', 'Barbacoas', 'El Charco', 'Ricaurte', 'Cumbal',
      'Sandoná', 'Linares', 'Taminango',
    ],
  },
  {
    department: 'Norte de Santander',
    cities: [
      'Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario', 'Los Patios',
      'El Zulia', 'Tibú', 'Sardinata', 'Chinácota', 'Abrego',
      'Convención', 'Puerto Santander',
    ],
  },
  {
    department: 'Putumayo',
    cities: [
      'Mocoa', 'Puerto Asís', 'Orito', 'La Hormiga', 'Puerto Leguízamo',
      'Sibundoy', 'San Francisco', 'Colón', 'Valle del Guamuéz',
    ],
  },
  {
    department: 'Quindío',
    cities: [
      'Armenia', 'Calarcá', 'Montenegro', 'Quimbaya', 'Circasia',
      'La Tebaida', 'Filandia', 'Génova', 'Buenavista',
    ],
  },
  {
    department: 'Risaralda',
    cities: [
      'Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia',
      'Marsella', 'Quinchía', 'Belén de Umbría', 'Santuario', 'Apía',
    ],
  },
  {
    department: 'San Andrés y Providencia',
    cities: ['San Andrés', 'Providencia'],
  },
  {
    department: 'Santander',
    cities: [
      'Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja',
      'San Gil', 'Socorro', 'Vélez', 'Málaga', 'Barbosa',
      'Lebrija', 'Rionegro', 'Sabana de Torres', 'Puerto Wilches',
      'Charalá', 'Capitanejo',
    ],
  },
  {
    department: 'Sucre',
    cities: [
      'Sincelejo', 'Corozal', 'Sampués', 'Tolú', 'San Marcos',
      'Morroa', 'Ovejas', 'San Onofre', 'Majagual', 'Guaranda',
    ],
  },
  {
    department: 'Tolima',
    cities: [
      'Ibagué', 'Espinal', 'Melgar', 'Honda', 'Chaparral',
      'Purificación', 'Mariquita', 'Líbano', 'Fresno', 'Armero',
      'Natagaima', 'Coyaima', 'Ataco', 'Planadas',
    ],
  },
  {
    department: 'Valle del Cauca',
    cities: [
      'Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Buga',
      'Cartago', 'Yumbo', 'Florida', 'Candelaria', 'Jamundí',
      'Zarzal', 'La Unión', 'Roldanillo', 'Sevilla', 'Caicedonia',
      'El Cerrito', 'Ginebra', 'Guacarí', 'Dagua', 'Buenaventura',
      'San Pedro', 'Pradera', 'Miranda',
    ],
  },
  {
    department: 'Vaupés',
    cities: ['Mitú', 'Carurú', 'Taraira', 'Yavaraté', 'Pacoa'],
  },
  {
    department: 'Vichada',
    cities: ['Puerto Carreño', 'La Primavera', 'Santa Rosalía', 'Cumaribo'],
  },
]

/** Sorted flat list of all department names */
export const DEPARTMENTS = COLOMBIA_LOCATIONS.map((l) => l.department).sort((a, b) =>
  a.localeCompare(b, 'es')
)

/** Returns the sorted city list for a given department name */
export function getCitiesForDepartment(department: string): string[] {
  const loc = COLOMBIA_LOCATIONS.find(
    (l) => l.department.toLowerCase() === department.toLowerCase()
  )
  return loc ? [...loc.cities].sort((a, b) => a.localeCompare(b, 'es')) : []
}

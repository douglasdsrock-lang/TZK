export interface Character {
  id: string;
  name: string;
  gender: 'male' | 'female';
  profileImage: string;
  fullImage: string;
  color: string; // Hex color
}

const femaleColors = [
  '#EF4444', // 01 - Vermelho
  '#10B981', // 02 - Verde
  '#FFB6C1', // 03 - Rosa Claro
  '#C8A2C8', // 04 - Lilas
  '#F97316', // 05 - Laranja
  '#FA8072', // 06 - Salmão
  '#EC4899', // 07 - Rosa
  '#8B5CF6', // 08 - Roxo
];

const maleColors = [
  '#10B981', // 01 - Verde
  '#3B82F6', // 02 - Azul
  '#F97316', // 03 - Laranja
  '#0EA5E9', // 04 - Azul claro
  '#FFD700', // 05 - Laranja amarelado (anteriormente no 08)
  '#EF4444', // 06 - Vermelho
  '#FF4500', // 07 - Laranja Avermelhado
  '#EF4444', // 08 - Vermelho
];

export const characters: Character[] = [
  // Masculinos
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `male_${i + 1}`,
    name: `Personagem ${i + 1}`,
    gender: 'male' as const,
    profileImage: `/characters/male_${i + 1}_profile.jpg`,
    fullImage: `/characters/male_${i + 1}_full.png`,
    color: maleColors[i],
  })),
  // Femininos
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `female_${i + 1}`,
    name: `Personagem ${i + 9}`,
    gender: 'female' as const,
    profileImage: `/characters/female_${i + 1}_profile.jpg`,
    fullImage: `/characters/female_${i + 1}_full.png`,
    color: femaleColors[i],
  })),
];

export function getCharacterById(id: string | null | undefined): Character | undefined {
  if (!id) return undefined;
  return characters.find(c => c.id === id);
}

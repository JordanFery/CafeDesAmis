/**
 * Catalogue produits importé depuis la feuille de commande fournie
 * (CAF_Feuille_de_commande_produits_1.pdf, v2 avec seuils). "unitsPerCase"
 * et "unit" reflètent le format de commande fournisseur tel qu'indiqué sur
 * la feuille — pas nécessairement l'unité de comptage interne. "stockMinimum"
 * est le seuil renseigné par l'utilisateur (colonne "seuil").
 */

export type UnitType = "KG" | "LITER" | "UNIT" | "LB" | "ROLL";

export type CatalogEntry = {
  name: string;
  category: string;
  supplier: string;
  unitsPerCase: number;
  unit: UnitType;
  stockMinimum: number;
};

const UNIT_MAP: Record<string, UnitType> = {
  "unité": "UNIT",
  "unités": "UNIT",
  litre: "LITER",
  litres: "LITER",
  kg: "KG",
  rouleaux: "ROLL",
};

export function normalizeUnit(raw: string): UnitType {
  const unit = UNIT_MAP[raw.trim().toLowerCase()];
  if (!unit) {
    throw new Error(`Unité inconnue dans le catalogue : "${raw}"`);
  }
  return unit;
}

const CATEGORY_MAP: Record<string, string> = {
  "breuvage chaud": "Boissons chaudes",
  "breuvage froid": "Boissons froides",
  "breuvage alcoolisées": "Boissons alcoolisées",
  dessert: "Dessert",
  "produits secs": "Produits secs",
  fourniture: "Fournitures",
  fournitures: "Fournitures",
  "fourniture d'hygiene": "Produits d'hygiène",
  "fourniture d'hygiène": "Produits d'hygiène",
};

export function normalizeCategory(raw: string): string {
  const category = CATEGORY_MAP[raw.trim().toLowerCase()];
  if (!category) {
    throw new Error(`Catégorie inconnue dans le catalogue : "${raw}"`);
  }
  return category;
}

const SUPPLIER_MAP: Record<string, string> = {
  gordon: "Gordon Food Service",
  cambium: "Cambium",
  "cactus kombucha": "Cactus Kombucha",
  snobiz: "Snobiz",
  boldwin: "Boldwin",
  "boréal": "Boréal",
  milton: "Milton",
  saq: "SAQ",
  "juliette & chocolat": "Juliette & Chocolat",
  "camélia": "Camélia",
};

export function normalizeSupplier(raw: string): string {
  const supplier = SUPPLIER_MAP[raw.trim().toLowerCase()];
  if (!supplier) {
    throw new Error(`Fournisseur inconnu dans le catalogue : "${raw}"`);
  }
  return supplier;
}

// [nom, catégorie brute, fournisseur brut, qte/caisse, mesure brute, seuil]
const RAW_CATALOG: [string, string, string, number, string, number][] = [
  ["Lait 2% 9x2l", "Breuvage chaud", "Gordon", 9, "Litres", 45],
  ["Lait de soya Original", "Breuvage chaud", "Gordon", 12, "Litres", 6],
  ["Lait d'amande", "Breuvage chaud", "Gordon", 12, "Litres", 6],
  ["Lait d'avoine", "Breuvage chaud", "Gordon", 12, "Litres", 12],
  ["Crème à café", "Breuvage chaud", "Gordon", 12, "Litres", 2],
  ["Crème fouettée aérosol 12x400g", "Breuvage chaud", "Gordon", 12, "Unités", 6],
  ["Poudre de cacao 22/24%", "Breuvage chaud", "Gordon", 3, "kg", 1.5],
  ["Sucre édulcorant", "Breuvage chaud", "Gordon", 2000, "Unités", 250],
  ["Sucre brun en sachet", "Breuvage chaud", "Gordon", 1000, "Unités", 250],
  ["Guimauve mini 12x400g", "Breuvage chaud", "Gordon", 12, "Unité", 6],
  ["Sirop d'érable ambré 2x4l", "Breuvage chaud", "Gordon", 8, "Litres", 2],
  ["Sirop de noisette 4x1 litre", "Breuvage chaud", "Gordon", 4, "Litres", 1],
  ["Sirop de caramel classique 4x1 litre", "Breuvage chaud", "Gordon", 4, "Litres", 1],
  ["Sirop de vanille 4x1 litre", "Breuvage chaud", "Gordon", 4, "Litre", 1],
  ["Thé Chai glacé", "Breuvage froid", "Gordon", 6, "Unités", 4],
  ["Tisane citron", "Breuvage chaud", "Gordon", 80, "Unités", 40],
  ["Tisane canneberge", "Breuvage chaud", "Gordon", 80, "Unités", 60],
  ["Tisane fruits de la passion", "Breuvage chaud", "Gordon", 80, "Unités", 60],
  ["Thé Chai noir équitable", "Breuvage chaud", "Gordon", 80, "Unités", 60],
  ["Thé Earl Grey", "Breuvage chaud", "Gordon", 120, "Unités", 60],
  ["Eau de source gazéifiée citron 12x500ml", "Breuvage froid", "Gordon", 12, "Unités", 24],
  ["Eau de source gazéifiée 12x500ml", "Breuvage froid", "Gordon", 12, "Unités", 24],
  ["Bubly cerise", "Breuvage froid", "Gordon", 12, "Unités", 24],
  ["Bubly lime", "Breuvage froid", "Gordon", 12, "Unités", 24],
  ["Eau source 500ml", "Breuvage froid", "Gordon", 24, "Unités", 240],
  ["Jus de pomme 300ml", "Breuvage froid", "Gordon", 24, "Unités", 48],
  ["Jus d'orange 300ml", "Breuvage froid", "Gordon", 24, "Unités", 48],
  ["Jus de pamplemousse 300ml", "Breuvage froid", "Gordon", 24, "Unités", 48],
  ["Jus de citron 12x945ml", "Breuvage froid", "Gordon", 12, "Unités", 6],
  ["Boisson gazeuse ginger ale 24x355ml", "Breuvage froid", "Gordon", 24, "Unités", 24],
  ["Boisson gazeuse coke classique 24x355ml", "Breuvage froid", "Gordon", 24, "Unités", 48],
  ["Boisson gazeuse coke zéro 24x355ml", "Breuvage froid", "Gordon", 24, "Unités", 48],
  ["Boisson gazeuse fanta 12x355ml", "Breuvage froid", "Gordon", 12, "Unités", 36],
  ["Boisson gazeuse Sprite", "Breuvage froid", "Gordon", 24, "Unités", 24],
  ["Beignes mini farcis fraise 9x6x32g", "Dessert", "Gordon", 54, "Unités", 27],
  ["Beignes mini farcis chocolat à la crème 9x6x32g", "Dessert", "Gordon", 54, "Unités", 27],
  ["Beignes mini farcis pomme et caramel 9x6x32g", "Dessert", "Gordon", 54, "Unités", 27],
  ["Beignes mini farcis caramel", "Dessert", "Gordon", 54, "Unités", 27],
  ["Beignets donuts tricolores", "Dessert", "Gordon", 168, "Unités", 40],
  ["Beignets érables", "Dessert", "Gordon", 168, "Unités", 40],
  ["Biscuits aux pépites de chocolat", "Dessert", "Gordon", 72, "Unités", 35],
  ["Biscuits double chocolat", "Dessert", "Gordon", 72, "Unités", 35],
  ["Brownie sans glaçage", "Dessert", "Gordon", 48, "Unités", 24],
  ["Croustade végane aux pommes sans gluten", "Dessert", "Gordon", 40, "Unités", 20],
  ["Gâteau plaque maison aux carottes", "Dessert", "Gordon", 48, "Unités", 24],
  ["Gâteau plaque Red Velvet", "Dessert", "Gordon", 60, "Unités", 30],
  ["Gâteau quatre-quarts banane 2x16", "Dessert", "Gordon", 30, "Unité", 15],
  ["Gâteau quatre-quarts citron/pavot 2x16", "Dessert", "Gordon", 30, "Unité", 15],
  ["Gâteau quatre-quarts choco marbré 2x16", "Dessert", "Gordon", 30, "Unité", 15],
  ["Gaufres", "Dessert", "Gordon", 48, "Unité", 15],
  ["Préparation crème glacée molle chocolat", "Dessert", "Gordon", 9, "Unités", 18],
  ["Préparation crème glacée molle vanille", "Dessert", "Gordon", 9, "Unités", 18],
  ["Croustilles BBQ 12x39g", "Produits secs", "Gordon", 12, "Unité", 12],
  ["Croustilles régulières 12x37g", "Produits secs", "Gordon", 12, "Unité", 12],
  ["Croustilles crème sure/oignon 39g", "Produits secs", "Gordon", 12, "Unités", 12],
  ["Croustilles régulières 40x40g", "Produits secs", "Gordon", 40, "Unité", 20],
  ["Croustilles sel/vinaigre 40x40g", "Produits secs", "Gordon", 40, "Unité", 20],
  ["Croustilles poivron et crème champêtre", "Produits secs", "Gordon", 40, "Unité", 20],
  ["Noix d'arachide salée 200g", "Produits secs", "Gordon", 6, "Unités", 3],
  ["Noix mélange randonneur", "Produits secs", "Gordon", 6, "Unités", 3],
  ["Noix mélange BBQ", "Produits secs", "Gordon", 6, "Unités", 3],
  ["Noix mélange sucré/salé portion", "Produits secs", "Gordon", 6, "Unités", 3],
  ["Noix mélange extrême", "Produits secs", "Gordon", 6, "Unités", 3],
  ["Spaghetti 20po", "Produits secs", "Gordon", 9.07, "kg", 1],
  ["Sucre fin", "Produits secs", "Gordon", 20, "kg", 10],
  ["Cabaret carton 4 tasses universel", "Fourniture", "Gordon", 300, "Unité", 50],
  ["Couteau en bouleau 6,5po", "Fourniture", "Gordon", 1000, "Unité", 100],
  ["Cuillère en bois 6po", "Fourniture", "Gordon", 1000, "Unité", 200],
  ["Fourchette en bois", "Fourniture", "Gordon", 1000, "Unité", 300],
  ["Sac brun kraft 14lb", "Fourniture", "Gordon", 500, "Unité", 50],
  ["Petit sac blanc viennoiseries", "Fourniture", "Gordon", 1000, "Unités", 200],
  ["Serviette de table blanche simple 2pl", "Fourniture", "Gordon", 2800, "Unités", 500],
  ["Assainisseur sans rinçage Final Step 2x2.5L", "Fourniture d'hygiène", "Gordon", 5, "Litres", 2.5],
  ["Détergent liquide vaisselle 2x2.5L", "Fourniture d'hygiène", "Gordon", 5, "Litre", 2.5],
  ["Dégraisseur HD Break Up 2x2.5L", "Fourniture d'hygiène", "Gordon", 5, "Litre", 2.5],
  ["Nettoyant dégraisseur Tempest 2x2.5L", "Fourniture d'hygiène", "Gordon", 5, "Litre", 2.5],
  ["Nettoyant vitre tout usage 2x2.5L", "Fourniture d'hygiène", "Gordon", 5, "Litre", 2.5],
  ["Nettoyant tout usage Forward 2x2.5L", "Fourniture d'hygiène", "Gordon", 5, "Litre", 2.5],
  ["Papier brun", "Fourniture d'hygiène", "Gordon", 12, "Rouleaux", 4],
  ["Filet à cheveux", "Fourniture d'hygiène", "Gordon", 144, "Unités", 144],
  ["Gants en nitrile noir sans poudre Moyen", "Fourniture d'hygiène", "Gordon", 1000, "Unité", 100],
  ["Gants en nitrile noir sans poudre Grand", "Fourniture d'hygiène", "Gordon", 100, "Unité", 100],
  ["Gants en nitrile noir sans poudre TG", "Fourniture d'hygiène", "Gordon", 100, "Unité", 100],
  ["Sac ordures polycar 35x50 transparent", "Fourniture d'hygiène", "Gordon", 100, "Unité", 25],
  ["Sac ordures noir ultrarésistant 35x50", "Fourniture d'hygiène", "Gordon", 100, "Unité", 25],
  ["Verres 4oz (espresso)", "Fournitures", "Cambium", 1000, "Unité", 150],
  ["Verres 8oz (double paroi)", "Fournitures", "Cambium", 500, "Unité", 250],
  ["Verres 12oz (double paroi)", "Fournitures", "Cambium", 500, "Unité", 500],
  ["Couvercles 8oz", "Fournitures", "Cambium", 1000, "Unité", 250],
  ["Couvercles 12oz", "Fournitures", "Cambium", 1000, "Unité", 500],
  ["Verres 12oz (froid)", "Fournitures", "Cambium", 1000, "Unité", 500],
  ["Verres 16oz (froid)", "Fournitures", "Cambium", 1000, "Unité", 500],
  ["Couvercles ouverture paille", "Fournitures", "Cambium", 1000, "Unité", 500],
  ["Pailles", "Fournitures", "Cambium", 4000, "Unité", 1000],
  ["Coupe crème glacée 6oz", "Fournitures", "Cambium", 1000, "Unité", 100],
  ["Bol à soupe", "Fournitures", "Cambium", 500, "Unité", 100],
  ["Couvercles bol à soupe", "Fournitures", "Cambium", 500, "Unité", 100],
  ["Bol à salade 34oz", "Fournitures", "Cambium", 300, "Unité", 100],
  ["Couvercles bol à salade", "Fournitures", "Cambium", 300, "Unité", 100],
  ["Boîte à emporter 69oz", "Fournitures", "Cambium", 200, "Unité", 100],
  ["Sacs à fond pincé (sandwichs)", "Fournitures", "Cambium", 1000, "Unité", 100],
  ["Sacs à fond pincé (viennoiseries)", "Fournitures", "Cambium", 1000, "Unité", 100],
  ["Kombucha rose/framboise", "Breuvage froid", "Cactus Kombucha", 12, "Unité", 12],
  ["Kombucha gingembre", "Breuvage froid", "Cactus Kombucha", 12, "Unité", 12],
  ["Kombucha sapin/épinette", "Breuvage froid", "Cactus Kombucha", 12, "Unité", 12],
  ["Kombucha lavande", "Breuvage froid", "Cactus Kombucha", 12, "Unité", 12],
  ["Kombucha bluet/thé des bois", "Breuvage froid", "Cactus Kombucha", 12, "Unité", 12],
  ["Slush limeade", "Breuvage froid", "Snobiz", 20, "Unité", 20],
  ["Slush cerise noire", "Breuvage froid", "Snobiz", 20, "Unité", 20],
  ["Slush piña colada", "Breuvage froid", "Snobiz", 20, "Unité", 20],
  ["Slush pomme verte", "Breuvage froid", "Snobiz", 20, "Unité", 20],
  ["Slush fraise/coco", "Breuvage froid", "Snobiz", 20, "Unité", 20],
  ["Forêt d'ange", "Breuvage alcoolisées", "Boldwin", 12, "Unité", 12],
  ["Lueur", "Breuvage alcoolisées", "Boldwin", 12, "Unité", 12],
  ["Caux", "Breuvage alcoolisées", "Boldwin", 12, "Unité", 12],
  ["Cité", "Breuvage alcoolisées", "Boldwin", 12, "Unité", 12],
  ["Ciel", "Breuvage alcoolisées", "Boldwin", 12, "Unité", 12],
  ["Champs d'eau", "Breuvage alcoolisées", "Boldwin", 12, "Unité", 12],
  ["Pic de l'Ourse", "Breuvage froid", "Boldwin", 12, "Unité", 12],
  ["Blonde", "Breuvage alcoolisées", "Boréal", 24, "Unité", 72],
  ["Blanche", "Breuvage alcoolisées", "Boréal", 24, "Unité", 72],
  ["Rousse", "Breuvage alcoolisées", "Boréal", 24, "Unité", 72],
  ["IPA", "Breuvage alcoolisées", "Boréal", 24, "Unité", 72],
  ["Milton Star - Pomme croquante", "Breuvage alcoolisées", "Milton", 24, "Unité", 24],
  ["Milton Star - Limonade framboise", "Breuvage alcoolisées", "Milton", 24, "Unité", 24],
  ["Milton Star - Limonade framboise bleue", "Breuvage alcoolisées", "Milton", 24, "Unité", 24],
  ["Milton Star - Limonade pêche", "Breuvage alcoolisées", "Milton", 24, "Unité", 24],
  ["Cidre Coccinelle - Fraise", "Breuvage froid", "Milton", 24, "Unité", 12],
  ["Vin blanc - petit", "Breuvage alcoolisées", "SAQ", 24, "Unité", 12],
  ["Vin blanc - grand", "Breuvage alcoolisées", "SAQ", 12, "Unité", 4],
  ["Vin rouge - petit", "Breuvage alcoolisées", "SAQ", 24, "Unité", 12],
  ["Vin rouge - grand", "Breuvage alcoolisées", "SAQ", 12, "Unité", 4],
  ["Vin rosé - petit", "Breuvage alcoolisées", "SAQ", 12, "Unité", 12],
  ["Vin rosé - grand", "Breuvage alcoolisées", "SAQ", 12, "Unité", 4],
  ["Vin rouge - 20L", "Breuvage alcoolisées", "SAQ", 20, "Litres", 20],
  ["Bacardi mojito", "Breuvage alcoolisées", "SAQ", 24, "Unité", 12],
  ["Bacardi piña colada", "Breuvage alcoolisées", "SAQ", 24, "Unité", 12],
  ["Cognac", "Breuvage alcoolisées", "SAQ", 1, "Unité", 0.5],
  ["Bailey's", "Breuvage alcoolisées", "SAQ", 1, "Unité", 1],
  ["Coureur des bois", "Breuvage alcoolisées", "SAQ", 1, "Unité", 1],
  ["Whisky", "Breuvage alcoolisées", "SAQ", 1, "Unité", 1],
  ["Bacardi Rhum - spiritueux", "Breuvage alcoolisées", "SAQ", 1, "Unité", 1],
  ["Chocolat Belcolade", "Breuvage chaud", "Juliette & Chocolat", 10, "kg", 50],
  ["Mix chocolat", "Breuvage chaud", "Juliette & Chocolat", 20, "kg", 100],
  ["Thé chai", "Breuvage chaud", "Camélia", 50, "Unité", 25],
  ["Thé menthe", "Breuvage chaud", "Camélia", 50, "Unité", 50],
  ["Thé Sublime", "Breuvage chaud", "Camélia", 50, "Unité", 25],
  ["Thé sencha nagashima", "Breuvage chaud", "Camélia", 50, "Unité", 25],
  ["Thé Rooibos Lune Rouge", "Breuvage chaud", "Camélia", 50, "Unité", 50],
  ["Thé Perles du dragon", "Breuvage chaud", "Camélia", 50, "Unité", 50],
  ["Thé L'éclatante", "Breuvage chaud", "Camélia", 50, "Unité", 50],
  ["Thé Mao Feng", "Breuvage chaud", "Camélia", 50, "Unité", 25],
  ["Thé Assam", "Breuvage chaud", "Camélia", 50, "Unité", 25],
];

export const CATALOG: CatalogEntry[] = RAW_CATALOG.map(
  ([name, category, supplier, unitsPerCase, unit, stockMinimum]) => ({
    name,
    category: normalizeCategory(category),
    supplier: normalizeSupplier(supplier),
    unitsPerCase,
    unit: normalizeUnit(unit),
    stockMinimum,
  })
);

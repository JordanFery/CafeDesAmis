/**
 * Catalogue produits importé depuis la feuille de commande fournie
 * (CAF_Feuille_de_commande_produits.pdf). "unitsPerCase" et "unit"
 * reflètent le format de commande fournisseur tel qu'indiqué sur la
 * feuille — pas nécessairement l'unité de comptage interne.
 *
 * stockMinimum n'était pas fourni dans la feuille : tous les produits
 * démarrent à 0 (pas de seuil défini). À ajuster via l'admin une fois
 * les vrais seuils connus.
 */

export type UnitType = "KG" | "LITER" | "UNIT" | "LB" | "ROLL";

export type CatalogEntry = {
  name: string;
  category: string;
  supplier: string;
  unitsPerCase: number;
  unit: UnitType;
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
};

export function normalizeSupplier(raw: string): string {
  const supplier = SUPPLIER_MAP[raw.trim().toLowerCase()];
  if (!supplier) {
    throw new Error(`Fournisseur inconnu dans le catalogue : "${raw}"`);
  }
  return supplier;
}

// [nom, catégorie brute, fournisseur brut, qte/caisse, mesure brute]
const RAW_CATALOG: [string, string, string, number, string][] = [
  ["Lait 2% 9x2l", "Breuvage chaud", "Gordon", 9, "Unités"],
  ["Lait de soya Original", "Breuvage chaud", "Gordon", 12, "Litres"],
  ["Lait d'amande", "Breuvage chaud", "Gordon", 12, "Litres"],
  ["Lait d'avoine", "Breuvage chaud", "Gordon", 12, "Litres"],
  ["Crème à café", "Breuvage chaud", "Gordon", 12, "Litres"],
  ["Crème fouettée aérosol 12x400g", "Breuvage chaud", "Gordon", 12, "Unités"],
  ["Poudre de cacao 22/24%", "Breuvage chaud", "Gordon", 3, "kg"],
  ["Sucre édulcorant", "Breuvage chaud", "Gordon", 2000, "Unités"],
  ["Sucre brun en sachet", "Breuvage chaud", "Gordon", 1000, "Unités"],
  ["Guimauve mini 12x400g", "Breuvage chaud", "Gordon", 12, "Unité"],
  ["Sirop d'érable ambré 2x4l", "Breuvage chaud", "Gordon", 8, "Litres"],
  ["Sirop de noisette 4x1 litre", "Breuvage chaud", "Gordon", 4, "Litres"],
  ["Sirop de caramel classique 4x1 litre", "Breuvage chaud", "Gordon", 4, "Litres"],
  ["Sirop de vanille 4x1 litre", "Breuvage chaud", "Gordon", 4, "Litre"],
  ["Thé Chai glacé", "Breuvage froid", "Gordon", 6, "Unités"],
  ["Tisane citron", "Breuvage chaud", "Gordon", 80, "Unités"],
  ["Tisane canneberge", "Breuvage chaud", "Gordon", 80, "Unités"],
  ["Tisane fruits de la passion", "Breuvage chaud", "Gordon", 80, "Unités"],
  ["Thé Chai noir équitable", "Breuvage chaud", "Gordon", 80, "Unités"],
  ["Thé Earl Grey", "Breuvage chaud", "Gordon", 120, "Unités"],
  ["Eau de source gazéifiée citron 12x500ml", "Breuvage froid", "Gordon", 12, "Unités"],
  ["Eau de source gazéifiée 12x500ml", "Breuvage froid", "Gordon", 12, "Unités"],
  ["Bubly cerise", "Breuvage froid", "Gordon", 12, "Unités"],
  ["Bubly lime", "Breuvage froid", "Gordon", 12, "Unités"],
  ["Eau source 500ml", "Breuvage froid", "Gordon", 24, "Unités"],
  ["Jus de pomme 300ml", "Breuvage froid", "Gordon", 24, "Unités"],
  ["Jus d'orange 300ml", "Breuvage froid", "Gordon", 24, "Unités"],
  ["Jus de pamplemousse 300ml", "Breuvage froid", "Gordon", 24, "Unités"],
  ["Jus de citron 12x945ml", "Breuvage froid", "Gordon", 12, "Unités"],
  ["Boisson gazeuse ginger ale 24x355ml", "Breuvage froid", "Gordon", 24, "Unités"],
  ["Boisson gazeuse coke classique 24x355ml", "Breuvage froid", "Gordon", 24, "Unités"],
  ["Boisson gazeuse coke zéro 24x355ml", "Breuvage froid", "Gordon", 24, "Unités"],
  ["Boisson gazeuse fanta 12x355ml", "Breuvage froid", "Gordon", 12, "Unités"],
  ["Boisson gazeuse Sprite", "Breuvage froid", "Gordon", 24, "Unités"],
  ["Beignes mini farcis fraise 9x6x32g", "Dessert", "Gordon", 54, "Unités"],
  ["Beignes mini farcis chocolat à la crème 9x6x32g", "Dessert", "Gordon", 54, "Unités"],
  ["Beignes mini farcis pomme et caramel 9x6x32g", "Dessert", "Gordon", 54, "Unités"],
  ["Beignes mini farcis caramel", "Dessert", "Gordon", 54, "Unités"],
  ["Beignets donuts tricolores", "Dessert", "Gordon", 168, "Unités"],
  ["Beignets érables", "Dessert", "Gordon", 168, "Unités"],
  ["Biscuits aux pépites de chocolat", "Dessert", "Gordon", 72, "Unités"],
  ["Biscuits double chocolat", "Dessert", "Gordon", 72, "Unités"],
  ["Brownie sans glaçage", "Dessert", "Gordon", 48, "Unités"],
  ["Croustade végane aux pommes sans gluten", "Dessert", "Gordon", 40, "Unités"],
  ["Gâteau plaque maison aux carottes", "Dessert", "Gordon", 48, "Unités"],
  ["Gâteau plaque Red Velvet", "Dessert", "Gordon", 60, "Unités"],
  ["Gâteau quatre-quarts banane 2x16", "Dessert", "Gordon", 30, "Unité"],
  ["Gâteau quatre-quarts citron/pavot 2x16", "Dessert", "Gordon", 30, "Unité"],
  ["Gâteau quatre-quarts choco marbré 2x16", "Dessert", "Gordon", 30, "Unité"],
  ["Gaufres", "Dessert", "Gordon", 48, "Unité"],
  ["Préparation crème glacée molle chocolat", "Dessert", "Gordon", 9, "Unités"],
  ["Préparation crème glacée molle vanille", "Dessert", "Gordon", 9, "Unités"],
  ["Croustilles BBQ 12x39g", "Produits secs", "Gordon", 12, "Unité"],
  ["Croustilles régulières 12x37g", "Produits secs", "Gordon", 12, "Unité"],
  ["Croustilles crème sure/oignon 39g", "Produits secs", "Gordon", 12, "Unités"],
  ["Croustilles régulières 40x40g", "Produits secs", "Gordon", 40, "Unité"],
  ["Croustilles sel/vinaigre 40x40g", "Produits secs", "Gordon", 40, "Unité"],
  ["Croustilles poivron et crème champêtre", "Produits secs", "Gordon", 40, "Unité"],
  ["Noix d'arachide salée 200g", "Produits secs", "Gordon", 6, "Unités"],
  ["Noix mélange randonneur", "Produits secs", "Gordon", 6, "Unités"],
  ["Noix mélange BBQ", "Produits secs", "Gordon", 6, "Unités"],
  ["Noix mélange sucré/salé portion", "Produits secs", "Gordon", 6, "Unités"],
  ["Noix mélange extrême", "Produits secs", "Gordon", 6, "Unités"],
  ["Spaghetti 20po", "Produits secs", "Gordon", 9.07, "kg"],
  ["Sucre fin", "Produits secs", "Gordon", 20, "kg"],
  ["Cabaret carton 4 tasses universel", "Fourniture", "Gordon", 300, "Unité"],
  ["Couteau en bouleau 6,5po", "Fourniture", "Gordon", 1000, "Unité"],
  ["Cuillère en bois 6po", "Fourniture", "Gordon", 1000, "Unité"],
  ["Fourchette en bois", "Fourniture", "Gordon", 1000, "Unité"],
  ["Sac brun kraft 14lb", "Fourniture", "Gordon", 500, "Unité"],
  ["Petit sac blanc viennoiseries", "Fourniture", "Gordon", 1000, "Unités"],
  ["Serviette de table blanche simple 2pl", "Fourniture", "Gordon", 2800, "Unités"],
  ["Assainisseur sans rinçage Final Step 2x2.5L", "Fourniture d'hygiène", "Gordon", 5, "Litres"],
  ["Détergent liquide vaisselle 2x2.5L", "Fourniture d'hygiène", "Gordon", 5, "Litre"],
  ["Dégraisseur HD Break Up 2x2.5L", "Fourniture d'hygiène", "Gordon", 5, "Litre"],
  ["Nettoyant dégraisseur Tempest 2x2.5L", "Fourniture d'hygiène", "Gordon", 5, "Litre"],
  ["Nettoyant vitre tout usage 2x2.5L", "Fourniture d'hygiène", "Gordon", 5, "Litre"],
  ["Nettoyant tout usage Forward 2x2.5L", "Fourniture d'hygiène", "Gordon", 5, "Litre"],
  ["Papier brun", "Fourniture d'hygiène", "Gordon", 12, "Rouleaux"],
  ["Filet à cheveux", "Fourniture d'hygiène", "Gordon", 144, "Unités"],
  ["Gants en nitrile noir sans poudre Moyen", "Fourniture d'hygiène", "Gordon", 1000, "Unité"],
  ["Gants en nitrile noir sans poudre Grand", "Fourniture d'hygiène", "Gordon", 100, "Unité"],
  ["Gants en nitrile noir sans poudre TG", "Fourniture d'hygiène", "Gordon", 100, "Unité"],
  ["Sac ordures polycar 35x50 transparent", "Fourniture d'hygiène", "Gordon", 100, "Unité"],
  ["Sac ordures noir ultrarésistant 35x50", "Fourniture d'hygiène", "Gordon", 100, "Unité"],
  ["Verres 4oz (espresso)", "Fournitures", "Cambium", 1000, "Unité"],
  ["Verres 8oz (double paroi)", "Fournitures", "Cambium", 500, "Unité"],
  ["Verres 12oz (double paroi)", "Fournitures", "Cambium", 500, "Unité"],
  ["Couvercles 8oz", "Fournitures", "Cambium", 1000, "Unité"],
  ["Couvercles 12oz", "Fournitures", "Cambium", 1000, "Unité"],
  ["Verres 12oz (froid)", "Fournitures", "Cambium", 1000, "Unité"],
  ["Verres 16oz (froid)", "Fournitures", "Cambium", 1000, "Unité"],
  ["Couvercles ouverture paille", "Fournitures", "Cambium", 1000, "Unité"],
  ["Pailles", "Fournitures", "Cambium", 4000, "Unité"],
  ["Coupe crème glacée 6oz", "Fournitures", "Cambium", 1000, "Unité"],
  ["Bol à soupe", "Fournitures", "Cambium", 500, "Unité"],
  ["Couvercles bol à soupe", "Fournitures", "Cambium", 500, "Unité"],
  ["Bol à salade 34oz", "Fournitures", "Cambium", 300, "Unité"],
  ["Couvercles bol à salade", "Fournitures", "Cambium", 300, "Unité"],
  ["Boîte à emporter 69oz", "Fournitures", "Cambium", 200, "Unité"],
  ["Sacs à fond pincé (sandwichs)", "Fournitures", "Cambium", 1000, "Unité"],
  ["Sacs à fond pincé (viennoiseries)", "Fournitures", "Cambium", 1000, "Unité"],
  ["Kombucha rose/framboise", "Breuvage froid", "Cactus Kombucha", 12, "Unité"],
  ["Kombucha gingembre", "Breuvage froid", "Cactus Kombucha", 12, "Unité"],
  ["Kombucha sapin/épinette", "Breuvage froid", "Cactus Kombucha", 12, "Unité"],
  ["Kombucha lavande", "Breuvage froid", "Cactus Kombucha", 12, "Unité"],
  ["Kombucha bluet/thé des bois", "Breuvage froid", "Cactus Kombucha", 12, "Unité"],
  ["Slush limeade", "Breuvage froid", "Snobiz", 20, "Unité"],
  ["Slush cerise noire", "Breuvage froid", "Snobiz", 20, "Unité"],
  ["Slush piña colada", "Breuvage froid", "Snobiz", 20, "Unité"],
  ["Slush pomme verte", "Breuvage froid", "Snobiz", 20, "Unité"],
  ["Slush fraise/coco", "Breuvage froid", "Snobiz", 20, "Unité"],
  ["Forêt d'ange", "Breuvage alcoolisées", "Boldwin", 12, "Unité"],
  ["Lueur", "Breuvage alcoolisées", "Boldwin", 12, "Unité"],
  ["Caux", "Breuvage alcoolisées", "Boldwin", 12, "Unité"],
  ["Cité", "Breuvage alcoolisées", "Boldwin", 12, "Unité"],
  ["Ciel", "Breuvage alcoolisées", "Boldwin", 12, "Unité"],
  ["Champs d'eau", "Breuvage alcoolisées", "Boldwin", 12, "Unité"],
  ["Pic de l'Ourse", "Breuvage froid", "Boldwin", 12, "Unité"],
  ["Blonde", "Breuvage alcoolisées", "Boréal", 24, "Unité"],
  ["Blanche", "Breuvage alcoolisées", "Boréal", 24, "Unité"],
  ["Rousse", "Breuvage alcoolisées", "Boréal", 24, "Unité"],
  ["IPA", "Breuvage alcoolisées", "Boréal", 24, "Unité"],
  ["Milton Star - Pomme croquante", "Breuvage alcoolisées", "Milton", 24, "Unité"],
  ["Milton Star - Limonade framboise", "Breuvage alcoolisées", "Milton", 24, "Unité"],
  ["Milton Star - Limonade framboise bleue", "Breuvage alcoolisées", "Milton", 24, "Unité"],
  ["Milton Star - Limonade pêche", "Breuvage alcoolisées", "Milton", 24, "Unité"],
  ["Cidre Coccinelle - Fraise", "Breuvage froid", "Milton", 24, "Unité"],
  ["Vin blanc - petit", "Breuvage alcoolisées", "SAQ", 24, "Unité"],
  ["Vin blanc - grand", "Breuvage alcoolisées", "SAQ", 12, "Unité"],
  ["Vin rouge - petit", "Breuvage alcoolisées", "SAQ", 24, "Unité"],
  ["Vin rouge - grand", "Breuvage alcoolisées", "SAQ", 12, "Unité"],
  ["Vin rosé - petit", "Breuvage alcoolisées", "SAQ", 12, "Unité"],
  ["Vin rosé - grand", "Breuvage alcoolisées", "SAQ", 12, "Unité"],
  ["Vin rouge - 20L", "Breuvage alcoolisées", "SAQ", 20, "Litres"],
  ["Bacardi mojito", "Breuvage alcoolisées", "SAQ", 24, "Unité"],
  ["Bacardi piña colada", "Breuvage alcoolisées", "SAQ", 24, "Unité"],
  ["Cognac", "Breuvage alcoolisées", "SAQ", 1, "Unité"],
  ["Bailey's", "Breuvage alcoolisées", "SAQ", 1, "Unité"],
  ["Coureur des bois", "Breuvage alcoolisées", "SAQ", 1, "Unité"],
  ["Bacardi Rhum - spiritueux", "Breuvage alcoolisées", "SAQ", 1, "Unité"],
  ["Chocolat Belcolade", "Breuvage chaud", "Juliette & Chocolat", 10, "kg"],
  ["Mix chocolat", "Breuvage chaud", "Juliette & Chocolat", 20, "kg"],
];

export const CATALOG: CatalogEntry[] = RAW_CATALOG.map(
  ([name, category, supplier, unitsPerCase, unit]) => ({
    name,
    category: normalizeCategory(category),
    supplier: normalizeSupplier(supplier),
    unitsPerCase,
    unit: normalizeUnit(unit),
  })
);

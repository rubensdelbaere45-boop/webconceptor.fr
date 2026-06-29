/**
 * Décodage des entités HTML communes (utile pour les champs scrapés
 * qui contiennent "D&eacute;pannage" au lieu de "Dépannage").
 *
 * Le double-encodage côté template (esc d'une string déjà encodée) produit
 * "&amp;eacute;" qui s'affiche littéralement "&eacute;" dans le navigateur.
 * On décode AVANT d'encoder pour neutraliser ce problème.
 */

const HTML_ENTITIES: Record<string, string> = {
  // Accents français les plus courants
  "&agrave;": "à", "&Agrave;": "À",
  "&aacute;": "á", "&Aacute;": "Á",
  "&acirc;": "â",  "&Acirc;": "Â",
  "&auml;": "ä",   "&Auml;": "Ä",
  "&aring;": "å",  "&Aring;": "Å",
  "&ae;": "æ",     "&AE;": "Æ",
  "&aelig;": "æ",  "&AElig;": "Æ",
  "&ccedil;": "ç", "&Ccedil;": "Ç",
  "&egrave;": "è", "&Egrave;": "È",
  "&eacute;": "é", "&Eacute;": "É",
  "&ecirc;": "ê",  "&Ecirc;": "Ê",
  "&euml;": "ë",   "&Euml;": "Ë",
  "&igrave;": "ì", "&Igrave;": "Ì",
  "&iacute;": "í", "&Iacute;": "Í",
  "&icirc;": "î",  "&Icirc;": "Î",
  "&iuml;": "ï",   "&Iuml;": "Ï",
  "&ograve;": "ò", "&Ograve;": "Ò",
  "&oacute;": "ó", "&Oacute;": "Ó",
  "&ocirc;": "ô",  "&Ocirc;": "Ô",
  "&ouml;": "ö",   "&Ouml;": "Ö",
  "&oelig;": "œ",  "&OElig;": "Œ",
  "&ugrave;": "ù", "&Ugrave;": "Ù",
  "&uacute;": "ú", "&Uacute;": "Ú",
  "&ucirc;": "û",  "&Ucirc;": "Û",
  "&uuml;": "ü",   "&Uuml;": "Ü",
  "&yuml;": "ÿ",   "&Yuml;": "Ÿ",
  "&ntilde;": "ñ", "&Ntilde;": "Ñ",
  // Ponctuation et symboles
  "&apos;": "'",
  "&lsquo;": "'", "&rsquo;": "'",
  "&ldquo;": "“", "&rdquo;": "”",
  "&laquo;": "«", "&raquo;": "»",
  "&hellip;": "…",
  "&mdash;": "—", "&ndash;": "–",
  "&nbsp;": " ",
  "&bull;": "•",
  "&copy;": "©", "&reg;": "®", "&trade;": "™",
  "&euro;": "€",
  "&deg;": "°",
  // & doit être décodé EN DERNIER (sinon double-decode)
};

/**
 * Décode les entités HTML communes. À utiliser sur tout champ scrapé
 * avant esc(). Décode aussi les entités numériques (&#233; → é, &#x00E9; → é).
 */
export function decodeHtmlEntities(s: string | null | undefined): string {
  if (!s) return "";
  let out = String(s);

  // 1) Entities nommées (&eacute; etc.)
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    if (out.includes(entity)) {
      out = out.split(entity).join(char);
    }
  }

  // 2) Entities numériques décimales &#NNN; (ex &#233; = é)
  out = out.replace(/&#(\d+);/g, (_, n) => {
    const code = parseInt(n, 10);
    if (code > 0 && code < 0x110000) {
      try { return String.fromCodePoint(code); } catch { return ""; }
    }
    return "";
  });

  // 3) Entities hexadécimales &#xNN; (ex &#x00E9; = é)
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => {
    const code = parseInt(n, 16);
    if (code > 0 && code < 0x110000) {
      try { return String.fromCodePoint(code); } catch { return ""; }
    }
    return "";
  });

  // 4) &gt; &lt; &quot; (laisser &amp; pour la fin)
  out = out.split("&gt;").join(">");
  out = out.split("&lt;").join("<");
  out = out.split("&quot;").join("\"");

  // 5) &amp; en DERNIER pour éviter de décoder &amp;eacute; en &eacute;
  // dans un texte déjà partiellement décodé.
  out = out.split("&amp;").join("&");

  return out;
}

/**
 * Encode pour insertion HTML safe : décode d'abord les entities (si déjà
 * encodées par le scraping), puis encode les 5 caractères dangereux.
 *
 * À utiliser à la place du esc() habituel dans tous les templates.
 */
export function safeEscHtml(s: string | null | undefined): string {
  if (s == null) return "";
  const decoded = decodeHtmlEntities(s);
  return decoded.replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]!));
}

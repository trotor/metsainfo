/**
 * Karttanäkymän rajat EPSG:3067:ssä. Kiinteistörajat haetaan näkymää
 * laajemmalta alueelta, jotta pienet siirrot (esim. paikannuksen seuranta)
 * eivät käynnistä uutta WFS-hakua.
 */

export function expandBbox(b, ratio) {
    const dx = (b.maxX - b.minX) * ratio;
    const dy = (b.maxY - b.minY) * ratio;
    return { minX: b.minX - dx, minY: b.minY - dy, maxX: b.maxX + dx, maxY: b.maxY + dy };
}

export function bboxContains(outer, inner) {
    if (!outer || !inner) return false;
    return inner.minX >= outer.minX && inner.minY >= outer.minY &&
        inner.maxX <= outer.maxX && inner.maxY <= outer.maxY;
}

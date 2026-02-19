/**
 * Forest statistics calculation
 */

import { CODES } from './config.js';
import { formatNumber } from './utils.js';

/**
 * Calculate statistics from features
 */
export function calculateStatistics(features) {
    const stats = {
        count: features.length,
        totalArea: 0,
        totalVolume: 0,
        avgVolume: 0,
        avgAge: 0,
        avgHeight: 0,
        avgDiameter: 0,
        avgGrowth: 0,
        avgSawlog: 0,
        avgPulpwood: 0,
        totalSawlog: 0,
        totalPulpwood: 0,
        avgBasalArea: 0,
        avgStemCount: 0,
        minAge: null, maxAge: null,
        minHeight: null, maxHeight: null,
        minDiameter: null, maxDiameter: null,
        minVolume: null, maxVolume: null,
        minGrowth: null, maxGrowth: null,
        speciesPercent: { pine: 0, spruce: 0, birch: 0, other: 0 },
        cuttingRecommendations: [],
        silvicultureRecommendations: [],
        fertilityDistribution: [],
        developmentDistribution: [],
        measurementYearMin: null,
        measurementYearMax: null
    };

    if (features.length === 0) return stats;

    let totalPine = 0, totalSpruce = 0, totalBirch = 0;
    let totalSpecies = 0;
    let validAgeCount = 0, validHeightCount = 0, validDiameterCount = 0, validGrowthCount = 0;
    let validSawlogCount = 0, validPulpwoodCount = 0;
    let validBasalAreaCount = 0, validStemCountCount = 0;

    const cuttingCounts = {};
    const silvicultureCounts = {};
    const fertilityCounts = {};
    const developmentCounts = {};

    features.forEach(f => {
        const p = f.properties;
        const area = p.AREA || 0;

        stats.totalArea += area;
        stats.totalVolume += (p.VOLUME || 0) * area;
        stats.avgVolume += p.VOLUME || 0;
        stats.totalSawlog += (p.SAWLOGVOLUME || 0) * area;
        stats.totalPulpwood += (p.PULPWOODVOLUME || 0) * area;

        // Track measurement years
        if (p.MEASUREMENTDATE) {
            const year = new Date(p.MEASUREMENTDATE).getFullYear();
            if (!isNaN(year)) {
                if (stats.measurementYearMin === null || year < stats.measurementYearMin) stats.measurementYearMin = year;
                if (stats.measurementYearMax === null || year > stats.measurementYearMax) stats.measurementYearMax = year;
            }
        }

        // Track min/max for volume
        if (p.VOLUME != null) {
            if (stats.minVolume === null || p.VOLUME < stats.minVolume) stats.minVolume = p.VOLUME;
            if (stats.maxVolume === null || p.VOLUME > stats.maxVolume) stats.maxVolume = p.VOLUME;
        }

        if (p.MEANAGE) {
            stats.avgAge += p.MEANAGE;
            validAgeCount++;
            if (stats.minAge === null || p.MEANAGE < stats.minAge) stats.minAge = p.MEANAGE;
            if (stats.maxAge === null || p.MEANAGE > stats.maxAge) stats.maxAge = p.MEANAGE;
        }
        if (p.MEANHEIGHT) {
            stats.avgHeight += p.MEANHEIGHT;
            validHeightCount++;
            if (stats.minHeight === null || p.MEANHEIGHT < stats.minHeight) stats.minHeight = p.MEANHEIGHT;
            if (stats.maxHeight === null || p.MEANHEIGHT > stats.maxHeight) stats.maxHeight = p.MEANHEIGHT;
        }
        if (p.MEANDIAMETER) {
            stats.avgDiameter += p.MEANDIAMETER;
            validDiameterCount++;
            if (stats.minDiameter === null || p.MEANDIAMETER < stats.minDiameter) stats.minDiameter = p.MEANDIAMETER;
            if (stats.maxDiameter === null || p.MEANDIAMETER > stats.maxDiameter) stats.maxDiameter = p.MEANDIAMETER;
        }
        if (p.VOLUMEGROWTH) {
            stats.avgGrowth += p.VOLUMEGROWTH;
            validGrowthCount++;
            if (stats.minGrowth === null || p.VOLUMEGROWTH < stats.minGrowth) stats.minGrowth = p.VOLUMEGROWTH;
            if (stats.maxGrowth === null || p.VOLUMEGROWTH > stats.maxGrowth) stats.maxGrowth = p.VOLUMEGROWTH;
        }
        if (p.SAWLOGVOLUME) { stats.avgSawlog += p.SAWLOGVOLUME; validSawlogCount++; }
        if (p.PULPWOODVOLUME) { stats.avgPulpwood += p.PULPWOODVOLUME; validPulpwoodCount++; }
        if (p.BASALAREA) { stats.avgBasalArea += p.BASALAREA; validBasalAreaCount++; }
        if (p.STEMCOUNT) { stats.avgStemCount += p.STEMCOUNT; validStemCountCount++; }

        // PROPORTION fields come as decimals (0.0-1.0), convert to percentages
        let pine = (p.PROPORTIONPINE || 0) * 100;
        let spruce = (p.PROPORTIONSPRUCE || 0) * 100;
        let deciduous = (p.PROPORTIONOTHER || 0) * 100;

        // Fallback: if no proportion data, use main tree species
        if ((pine + spruce + deciduous) === 0 && p.MAINTREESPECIES) {
            const species = Number(p.MAINTREESPECIES);
            if (species === 1) pine = 100;
            else if (species === 2) spruce = 100;
            else deciduous = 100;
        }

        totalPine += pine * area;
        totalSpruce += spruce * area;
        totalBirch += deciduous * area;
        totalSpecies += area;

        if (p.CUTTINGTYPE) {
            const code = p.CUTTINGTYPE;
            const name = CODES.cuttingType[code] || `Tyyppi ${code}`;
            const year = p.CUTTINGPROPOSALYEAR;
            const key = `${code}`;
            if (!cuttingCounts[key]) {
                cuttingCounts[key] = { code, name, count: 0, years: [] };
            }
            cuttingCounts[key].count++;
            if (year) cuttingCounts[key].years.push(year);
        }

        if (p.SILVICULTURETYPE) {
            const code = p.SILVICULTURETYPE;
            const name = CODES.silvicultureType[code] || `Tyyppi ${code}`;
            const year = p.SILVICULTUREPROPOSALYEAR;
            const key = `${code}`;
            if (!silvicultureCounts[key]) {
                silvicultureCounts[key] = { code, name, count: 0, years: [] };
            }
            silvicultureCounts[key].count++;
            if (year) silvicultureCounts[key].years.push(year);
        }

        if (p.FERTILITYCLASS) {
            const code = p.FERTILITYCLASS;
            const name = CODES.fertilityClass[code] || `Tyyppi ${code}`;
            if (!fertilityCounts[code]) {
                fertilityCounts[code] = { name, area: 0 };
            }
            fertilityCounts[code].area += area;
        }

        if (p.DEVELOPMENTCLASS) {
            const code = p.DEVELOPMENTCLASS;
            const name = CODES.developmentClass[code] || code;
            if (!developmentCounts[code]) {
                developmentCounts[code] = { name, count: 0 };
            }
            developmentCounts[code].count++;
        }
    });

    stats.avgVolume = stats.avgVolume / features.length;
    stats.avgAge = validAgeCount > 0 ? stats.avgAge / validAgeCount : 0;
    stats.avgHeight = validHeightCount > 0 ? stats.avgHeight / validHeightCount : 0;
    stats.avgDiameter = validDiameterCount > 0 ? stats.avgDiameter / validDiameterCount : 0;
    stats.avgGrowth = validGrowthCount > 0 ? stats.avgGrowth / validGrowthCount : 0;
    stats.avgSawlog = validSawlogCount > 0 ? stats.avgSawlog / validSawlogCount : 0;
    stats.avgPulpwood = validPulpwoodCount > 0 ? stats.avgPulpwood / validPulpwoodCount : 0;
    stats.avgBasalArea = validBasalAreaCount > 0 ? stats.avgBasalArea / validBasalAreaCount : 0;
    stats.avgStemCount = validStemCountCount > 0 ? stats.avgStemCount / validStemCountCount : 0;

    if (totalSpecies > 0) {
        stats.speciesPercent.pine = Math.round(totalPine / totalSpecies);
        stats.speciesPercent.spruce = Math.round(totalSpruce / totalSpecies);
        stats.speciesPercent.birch = Math.round(totalBirch / totalSpecies);

        const total = stats.speciesPercent.pine + stats.speciesPercent.spruce + stats.speciesPercent.birch;
        if (total !== 100 && total > 0) {
            stats.speciesPercent.birch += (100 - total);
        }
    }

    stats.cuttingRecommendations = Object.values(cuttingCounts)
        .map(r => ({
            code: r.code,
            name: r.name,
            count: r.count,
            year: r.years.length > 0 ? Math.min(...r.years) : null
        }))
        .sort((a, b) => b.count - a.count);

    stats.silvicultureRecommendations = Object.values(silvicultureCounts)
        .map(r => ({
            code: r.code,
            name: r.name,
            count: r.count,
            year: r.years.length > 0 ? Math.min(...r.years) : null
        }))
        .sort((a, b) => b.count - a.count);

    stats.fertilityDistribution = Object.values(fertilityCounts)
        .map(f => ({ name: f.name, area: formatNumber(f.area, 2) }))
        .sort((a, b) => parseFloat(b.area) - parseFloat(a.area));

    stats.developmentDistribution = Object.values(developmentCounts)
        .sort((a, b) => b.count - a.count);

    return stats;
}

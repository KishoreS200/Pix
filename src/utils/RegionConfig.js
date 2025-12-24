const createRegion = ({ name, width, height, spawn, portals }) => {
    const minX = 0;
    const minY = 0;

    return {
        name,
        width,
        height,
        bounds: {
            minX,
            minY,
            maxX: minX + width,
            maxY: minY + height
        },
        spawn,
        portals
    };
};

export const RegionConfig = {
    'Silent Village': createRegion({
        name: 'Silent Village',
        width: 1600,
        height: 1200,
        spawn: { x: 400, y: 300 },
        portals: [
            {
                id: 'sv_to_ff',
                rect: { x: 1560, y: 520, width: 40, height: 160 },
                toRegion: 'Forgotten Forest',
                spawn: { x: 80, y: 900 }
            }
        ]
    }),
    'Forgotten Forest': createRegion({
        name: 'Forgotten Forest',
        width: 2400,
        height: 1800,
        spawn: { x: 120, y: 900 },
        portals: [
            {
                id: 'ff_to_sv',
                rect: { x: 0, y: 820, width: 40, height: 160 },
                toRegion: 'Silent Village',
                spawn: { x: 1500, y: 600 }
            },
            {
                id: 'ff_to_cm',
                rect: { x: 1180, y: 1760, width: 160, height: 40 },
                toRegion: 'Crystal Mines',
                spawn: { x: 800, y: 120 }
            }
        ]
    }),
    'Crystal Mines': createRegion({
        name: 'Crystal Mines',
        width: 1600,
        height: 1600,
        spawn: { x: 800, y: 180 },
        portals: [
            {
                id: 'cm_to_ff',
                rect: { x: 720, y: 0, width: 160, height: 40 },
                toRegion: 'Forgotten Forest',
                spawn: { x: 1200, y: 1650 }
            },
            {
                id: 'cm_to_bc',
                rect: { x: 1560, y: 720, width: 40, height: 160 },
                toRegion: 'Broken City',
                spawn: { x: 120, y: 1200 }
            }
        ]
    }),
    'Broken City': createRegion({
        name: 'Broken City',
        width: 2400,
        height: 2400,
        spawn: { x: 200, y: 1200 },
        portals: [
            {
                id: 'bc_to_cm',
                rect: { x: 0, y: 1120, width: 40, height: 160 },
                toRegion: 'Crystal Mines',
                spawn: { x: 1500, y: 800 }
            },
            {
                id: 'bc_to_core',
                rect: { x: 1180, y: 2360, width: 160, height: 40 },
                toRegion: 'The Core',
                spawn: { x: 1000, y: 300 }
            }
        ]
    }),
    'The Core': createRegion({
        name: 'The Core',
        width: 2000,
        height: 2000,
        spawn: { x: 1000, y: 400 },
        portals: [
            {
                id: 'core_to_bc',
                rect: { x: 920, y: 0, width: 160, height: 40 },
                toRegion: 'Broken City',
                spawn: { x: 1200, y: 2200 }
            }
        ]
    })
};

export const Regions = Object.freeze({
    SILENT_VILLAGE: 'Silent Village',
    FORGOTTEN_FOREST: 'Forgotten Forest',
    CRYSTAL_MINES: 'Crystal Mines',
    BROKEN_CITY: 'Broken City',
    THE_CORE: 'The Core'
});

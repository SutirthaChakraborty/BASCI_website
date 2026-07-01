/**
 * BASCI Formation Builder - formation presets for 5v5 through 11v11.
 * Coordinates are percentages (0-100) on a portrait pitch: y=96 is the
 * defending goal line (near GK), y=6 is the attacking end.
 */
(function (global) {
    'use strict';

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function rowX(count) {
        if (count <= 1) return [50];
        const margin = 14;
        const span = 100 - margin * 2;
        const xs = [];
        for (let i = 0; i < count; i++) {
            xs.push(Math.round((margin + (span * i) / (count - 1)) * 10) / 10);
        }
        return xs;
    }

    const LABELS = {
        def: {
            1: ['CB'],
            2: ['CB', 'CB'],
            3: ['CB', 'CB', 'CB'],
            4: ['LB', 'CB', 'CB', 'RB'],
            5: ['LWB', 'CB', 'CB', 'CB', 'RWB']
        },
        dm: {
            1: ['CDM'],
            2: ['CDM', 'CDM'],
            3: ['CM', 'CDM', 'CM'],
            4: ['LM', 'CM', 'CM', 'RM']
        },
        mid: {
            1: ['CM'],
            2: ['CM', 'CM'],
            3: ['LM', 'CM', 'RM'],
            4: ['LM', 'CM', 'CM', 'RM'],
            5: ['LM', 'LCM', 'CM', 'RCM', 'RM']
        },
        am: {
            1: ['CAM'],
            2: ['CAM', 'CAM'],
            3: ['LW', 'CAM', 'RW'],
            4: ['LM', 'CAM', 'CAM', 'RM']
        },
        att: {
            1: ['ST'],
            2: ['ST', 'ST'],
            3: ['LW', 'ST', 'RW'],
            4: ['LW', 'ST', 'ST', 'RW']
        }
    };

    function labelsFor(type, count) {
        const table = LABELS[type] || LABELS.mid;
        return table[count] || Array.from({ length: count }, () => type.toUpperCase());
    }

    function roleFor(type) {
        if (type === 'def') return 'def';
        if (type === 'att') return 'att';
        return 'mid';
    }

    // Builds a formation from an array of outfield row counts, ordered from
    // the row closest to the goalkeeper to the row closest to the opponent's goal.
    function rowFormation(name, rows) {
        const positions = [{ x: 50, y: 95, label: 'GK', role: 'gk' }];
        const n = rows.length;
        let middleTypes = [];
        if (n === 2) middleTypes = [];
        if (n >= 3) {
            const middleCount = n - 2;
            if (middleCount === 1) middleTypes = ['mid'];
            else if (middleCount === 2) middleTypes = ['dm', 'am'];
            else if (middleCount === 3) middleTypes = ['dm', 'mid', 'am'];
            else middleTypes = Array.from({ length: middleCount }, (_, i) => (i % 2 === 0 ? 'dm' : 'am'));
        }
        const types = rows.map((_, i) => {
            if (i === 0) return 'def';
            if (i === n - 1) return 'att';
            return middleTypes[i - 1] || 'mid';
        });

        rows.forEach((count, rowIndex) => {
            const y = Math.round(lerp(80, 12, n === 1 ? 0.5 : rowIndex / (n - 1)) * 10) / 10;
            const xs = rowX(count);
            const type = types[rowIndex];
            const labels = labelsFor(type, count);
            xs.forEach((x, i) => {
                positions.push({ x, y, label: labels[i] || type.toUpperCase(), role: roleFor(type) });
            });
        });

        return { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, positions };
    }

    function customFormation(name, positions) {
        return { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, positions };
    }

    const FORMATIONS = {
        '5v5': [
            rowFormation('1-2-1', [1, 2, 1]),
            rowFormation('2-2', [2, 2]),
            rowFormation('2-1-1', [2, 1, 1])
        ],
        '6v6': [
            rowFormation('2-2-1', [2, 2, 1]),
            rowFormation('3-2', [3, 2]),
            rowFormation('1-3-1', [1, 3, 1])
        ],
        '7v7': [
            rowFormation('2-3-1', [2, 3, 1]),
            rowFormation('3-2-1', [3, 2, 1]),
            rowFormation('2-2-2', [2, 2, 2]),
            rowFormation('1-3-2', [1, 3, 2])
        ],
        '8v8': [
            rowFormation('3-3-1', [3, 3, 1]),
            rowFormation('2-3-2', [2, 3, 2]),
            rowFormation('3-2-2', [3, 2, 2])
        ],
        '9v9': [
            rowFormation('3-3-2', [3, 3, 2]),
            rowFormation('3-4-1', [3, 4, 1]),
            rowFormation('4-3-1', [4, 3, 1])
        ],
        '10v10': [
            rowFormation('4-4-1', [4, 4, 1]),
            rowFormation('3-4-2', [3, 4, 2]),
            rowFormation('4-3-2', [4, 3, 2])
        ],
        '11v11': [
            rowFormation('4-2-3-1', [4, 2, 3, 1]),
            rowFormation('3-4-3', [3, 4, 3]),
            rowFormation('4-5-1', [4, 5, 1]),
            customFormation('4-4-2 Diamond', [
                { x: 50, y: 95, label: 'GK', role: 'gk' },
                { x: 15, y: 78, label: 'LB', role: 'def' },
                { x: 38, y: 78, label: 'CB', role: 'def' },
                { x: 62, y: 78, label: 'CB', role: 'def' },
                { x: 85, y: 78, label: 'RB', role: 'def' },
                { x: 50, y: 62, label: 'CDM', role: 'mid' },
                { x: 26, y: 48, label: 'CM', role: 'mid' },
                { x: 74, y: 48, label: 'CM', role: 'mid' },
                { x: 50, y: 34, label: 'CAM', role: 'mid' },
                { x: 36, y: 14, label: 'ST', role: 'att' },
                { x: 64, y: 14, label: 'ST', role: 'att' }
            ]),
            rowFormation('4-3-3', [4, 3, 3]),
            customFormation('4-4-1-1', [
                { x: 50, y: 95, label: 'GK', role: 'gk' },
                { x: 15, y: 78, label: 'LB', role: 'def' },
                { x: 38, y: 78, label: 'CB', role: 'def' },
                { x: 62, y: 78, label: 'CB', role: 'def' },
                { x: 85, y: 78, label: 'RB', role: 'def' },
                { x: 15, y: 56, label: 'LM', role: 'mid' },
                { x: 38, y: 56, label: 'CM', role: 'mid' },
                { x: 62, y: 56, label: 'CM', role: 'mid' },
                { x: 85, y: 56, label: 'RM', role: 'mid' },
                { x: 50, y: 32, label: 'CF', role: 'att' },
                { x: 50, y: 12, label: 'ST', role: 'att' }
            ]),
            rowFormation('3-3-1-3', [3, 3, 1, 3]),
            rowFormation('4-4-2', [4, 4, 2]),
            rowFormation('3-5-2', [3, 5, 2])
        ]
    };

    const FORMATS = ['5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11'];

    // Default per-position instructions, auto-assigned when a player takes a
    // slot. The coach can freely edit or replace any of these.
    const DUTY_DEFAULTS = {
        GK: 'Command the box, distribute quickly to open full-backs.',
        CB: 'Stay compact, win first and second balls, cover in behind the full-backs.',
        LB: 'Overlap in possession, track the winger and tuck in defensively.',
        RB: 'Overlap in possession, track the winger and tuck in defensively.',
        LWB: 'Provide width in attack, drop in as a third centre-back out of possession.',
        RWB: 'Provide width in attack, drop in as a third centre-back out of possession.',
        CDM: 'Screen the back line, break up play, recycle possession simply.',
        CM: 'Link defense to attack, box-to-box energy, support both boxes.',
        LCM: 'Link defense to attack, box-to-box energy, support both boxes.',
        RCM: 'Link defense to attack, box-to-box energy, support both boxes.',
        CAM: 'Find pockets between the lines, create chances, arrive late in the box.',
        LM: 'Track back to support the full-back, stretch play out wide.',
        RM: 'Track back to support the full-back, stretch play out wide.',
        LW: 'Cut inside or hug the touchline, create 1v1 opportunities.',
        RW: 'Cut inside or hug the touchline, create 1v1 opportunities.',
        CF: 'Drop deep to link play, hold the ball up for support.',
        ST: 'Stay on the last shoulder, attack the box, finish chances.',
        SUB: 'Warm up and stay ready - listen for tactical instructions.'
    };

    // Team-level tactical notes suggested per playing style. Shown as
    // one-tap "use suggested" text the coach can accept or freely rewrite.
    const STYLE_NOTES = {
        balanced: {
            attack: 'Mix direct and patient build-up depending on the scoreline. Commit full-backs forward when we have control of midfield.',
            defend: 'Medium block - stay organized and compact, react to how the opponent sets up rather than forcing the press.',
            midfield: 'Balance defensive discipline with support for attacks; one holding midfielder always stays available to the back line.'
        },
        attacking: {
            attack: 'Commit numbers forward early, full-backs push high and wide, press immediately the moment we lose the ball.',
            defend: 'High defensive line, squeeze the pitch into wide areas, aim to win the ball back within 6 seconds of losing it.',
            midfield: 'Midfielders push up to support the attack and overload the opposition\'s defensive third.'
        },
        defensive: {
            attack: 'Counter quickly on turnover - direct ball to the striker, limited numbers committed forward to stay protected.',
            defend: 'Deep low block, stay compact between the lines, force play wide and clear crosses first time.',
            midfield: 'Sit deep to protect the back four, delay the opposition\'s attacks and force play backwards.'
        },
        counter: {
            attack: 'Break at speed on regaining possession - target space in behind, wide players sprint to stretch the defense.',
            defend: 'Mid-block that invites pressure then springs forward - stay disciplined and hold shape until the trigger to press.',
            midfield: 'Win the ball centrally then release quickly - avoid over-committing bodies forward before the break is on.'
        },
        possession: {
            attack: 'Patient build-up from the back, rotate positions to open passing angles, probe until a gap appears.',
            defend: 'Counter-press immediately after losing the ball (5-second rule) to win it back high up the pitch.',
            midfield: 'Control the tempo, keep the ball moving side to side to drag the opposition out of shape.'
        }
    };

    global.BASCIFormations = { FORMATIONS, FORMATS, DUTY_DEFAULTS, STYLE_NOTES, rowFormation, customFormation };
})(window);

/**
 * BASCI Poster Generator - template library.
 * Each scaffold is fed to the Gemini text model along with the admin's
 * free-text details to produce a rich image-generation prompt.
 */
(function (global) {
    'use strict';

    const BRAND_NOTE = 'Brand colors: deep field green #1a5f2a and saffron gold #d4a012, ' +
        'with crisp white accents. The BASCI club crest will be composited onto the image ' +
        'afterwards, so do not invent a different logo or club crest, and leave clean space ' +
        'in a corner for a badge.';

    const TEMPLATES = [
        {
            id: 'match-day',
            category: 'events',
            name: 'Match Day Announcement',
            emoji: '⚽',
            aspect: '4:5',
            description: 'Announce an upcoming fixture with kickoff time and venue.',
            placeholder: 'e.g. BASCI vs NCC Friendship Cup, Saturday 14th, 5:00 PM, Baldoyle',
            scaffold: 'A bold, high-energy amateur football club match-day announcement poster. ' +
                'Dynamic diagonal composition, stadium floodlights or a dramatic grass pitch backdrop, ' +
                'motion-blur action silhouette of a footballer mid-kick, strong condensed sports typography ' +
                'feel (leave room for a headline and kickoff details to be overlaid later). ' + BRAND_NOTE
        },
        {
            id: 'victory',
            category: 'events',
            name: 'Match / Tournament Victory',
            emoji: '🏆',
            aspect: '4:5',
            description: 'Celebrate a win, trophy lift, or tournament result.',
            placeholder: 'e.g. Champions of the Roy Sinha Memorial Derby Cup 2026!',
            scaffold: 'A triumphant sports victory celebration poster: golden confetti and light rays, ' +
                'a glowing trophy silhouette, celebratory energy, premium sports-broadcast graphic style. ' +
                'Leave open space near the top and bottom for a headline and score/result text. ' + BRAND_NOTE
        },
        {
            id: 'player-award',
            category: 'congratulations',
            name: 'Player of the Match / Month',
            emoji: '⭐',
            aspect: '1:1',
            description: 'Spotlight an individual player\'s standout performance.',
            placeholder: 'e.g. Rahul Sen - Player of the Month, hat-trick vs NCC',
            scaffold: 'A premium sports "player spotlight" award graphic: single dramatic spotlight beam ' +
                'on a football-pitch backdrop at dusk, gold star and ribbon motifs, athletic and aspirational ' +
                'mood, clean negative space for a player name and stat line to be overlaid. ' + BRAND_NOTE
        },
        {
            id: 'congrats',
            category: 'congratulations',
            name: 'Congratulations - Achievement',
            emoji: '🎉',
            aspect: '1:1',
            description: 'Congratulate a member for an award, milestone, or personal news.',
            placeholder: 'e.g. Congratulating Priya on her wedding / new job / exam success',
            scaffold: 'A warm, celebratory congratulations graphic with confetti, gold ribbons and soft ' +
                'bokeh light, joyful and community-oriented tone suitable for a sports club family. ' +
                'Leave clean space for a name and short congratulatory message to be overlaid. ' + BRAND_NOTE
        },
        {
            id: 'birthday',
            category: 'congratulations',
            name: 'Birthday Shoutout',
            emoji: '🎂',
            aspect: '1:1',
            description: 'Wish a member or player a happy birthday.',
            placeholder: 'e.g. Happy Birthday to our captain, Arjun!',
            scaffold: 'A fun, festive birthday card style graphic with balloons, confetti and a football ' +
                'motif woven in subtly (e.g. a ball-shaped balloon), bright and cheerful, space left for a ' +
                'name and birthday message to be overlaid. ' + BRAND_NOTE
        },
        {
            id: 'welcome',
            category: 'misc',
            name: 'Welcome New Player / Sponsor',
            emoji: '🤝',
            aspect: '1:1',
            description: 'Welcome a new signing, member, or sponsor to the club.',
            placeholder: 'e.g. Welcoming our new sponsor, Dublin Bengal Grocers!',
            scaffold: 'A friendly, professional "welcome to the club" announcement graphic, handshake or ' +
                'jersey-reveal motif, warm inviting colors, community and partnership feel, space reserved ' +
                'for a name and welcome message to be overlaid. ' + BRAND_NOTE
        },
        {
            id: 'training',
            category: 'events',
            name: 'Training Camp / Trials',
            emoji: '🏃',
            aspect: '4:5',
            description: 'Announce training sessions, trials, or a coaching camp.',
            placeholder: 'e.g. Summer Training Camp, every Sunday 10am, all skill levels welcome',
            scaffold: 'An energetic training-session announcement poster: players running drills at golden ' +
                'hour on a football pitch, cones and training gear, motivational and disciplined mood, space ' +
                'left for schedule details to be overlaid. ' + BRAND_NOTE
        },
        {
            id: 'festival',
            category: 'events',
            name: 'Cultural Festival Celebration',
            emoji: '🎊',
            aspect: '4:5',
            description: 'Promote a Bengali cultural event such as Durga Puja or a community festival.',
            placeholder: 'e.g. BASCI Durga Puja Celebration, all families welcome',
            scaffold: 'A vibrant Bengali cultural festival celebration poster blending community-sports club ' +
                'warmth with festive cultural motifs (string lights, marigold and red-gold festive colors, ' +
                'joyful crowd silhouettes), inclusive family-friendly atmosphere, space left for event details ' +
                'to be overlaid. ' + BRAND_NOTE
        },
        {
            id: 'fundraiser',
            category: 'misc',
            name: 'Fundraiser / Charity Drive',
            emoji: '💚',
            aspect: '1:1',
            description: 'Promote a charity match, fundraiser, or community drive.',
            placeholder: 'e.g. Charity Match for local hospital fund, entry by donation',
            scaffold: 'A heartfelt community fundraiser graphic combining sports club energy with charitable ' +
                'giving symbolism (hands, hearts, or a ribbon motif), warm and sincere tone, clean space for a ' +
                'cause description and call to action. ' + BRAND_NOTE
        },
        {
            id: 'general',
            category: 'misc',
            name: 'General Club Announcement',
            emoji: '📣',
            aspect: '1:1',
            description: 'A flexible template for any other club news or notice.',
            placeholder: 'e.g. AGM scheduled for next month, all members please attend',
            scaffold: 'A clean, modern sports-club announcement graphic, bold geometric shapes, subtle pitch ' +
                'texture background, professional and versatile enough for any club notice, with clear open ' +
                'space for a headline and details to be overlaid. ' + BRAND_NOTE
        }
    ];

    global.BASCIPosterTemplates = TEMPLATES;
})(window);

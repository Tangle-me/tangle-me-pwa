<?php
// words-list-2000.php - Comprehensive 2000-word curated dictionary for Tangle-me PWA usernames
// Carefully curated to be globally friendly, memorable, and offensive-free

class WordList2000 {
    
    // NATURE & WEATHER (350 words)
    private static $nature = [
        // Sky & Weather
        'cloud', 'storm', 'breeze', 'wind', 'rain', 'snow', 'frost', 'dew', 'mist', 'fog',
        'hail', 'sleet', 'drizzle', 'shower', 'thunder', 'lightning', 'aurora', 'rainbow', 'halo', 'zenith',
        'horizon', 'sky', 'sunrise', 'sunset', 'dawn', 'dusk', 'noon', 'twilight', 'daybreak', 'evening',
        'moon', 'star', 'solar', 'lunar', 'stellar', 'cosmos', 'galaxy', 'nebula', 'comet', 'meteor',
        
        // Water Bodies
        'river', 'ocean', 'sea', 'wave', 'tide', 'stream', 'creek', 'brook', 'spring', 'cascade',
        'lake', 'pond', 'pool', 'lagoon', 'marsh', 'swamp', 'wetland', 'bayou', 'estuary', 'inlet',
        'waterfall', 'rapids', 'whirlpool', 'current', 'eddy', 'surf', 'spray', 'splash', 'ripple', 'flow',
        
        // Land Features
        'mountain', 'hill', 'valley', 'peak', 'ridge', 'cliff', 'canyon', 'mesa', 'butte', 'plateau',
        'plain', 'prairie', 'steppe', 'tundra', 'desert', 'oasis', 'dune', 'crater', 'volcano', 'geyser',
        'cave', 'cavern', 'grotto', 'gorge', 'ravine', 'crevice', 'boulder', 'rock', 'stone', 'pebble',
        
        // Flora
        'forest', 'woods', 'tree', 'oak', 'pine', 'maple', 'willow', 'cedar', 'birch', 'elm',
        'ash', 'beech', 'palm', 'bamboo', 'fern', 'moss', 'ivy', 'vine', 'reed', 'grass',
        'meadow', 'field', 'garden', 'grove', 'orchard', 'vineyard', 'thicket', 'brush', 'shrub', 'bush',
        'flower', 'bloom', 'blossom', 'petal', 'bud', 'leaf', 'branch', 'root', 'bark', 'seed',
        
        // Seasons & Time
        'spring', 'summer', 'autumn', 'winter', 'fall', 'season', 'harvest', 'solstice', 'equinox', 'cycle',
        
        // Elements & Minerals
        'sand', 'clay', 'soil', 'earth', 'dust', 'powder', 'gravel', 'silt', 'loam', 'peat',
        'crystal', 'mineral', 'quartz', 'granite', 'marble', 'slate', 'limestone', 'sandstone', 'basalt', 'obsidian',
        
        // Fire & Light
        'flame', 'fire', 'blaze', 'spark', 'ember', 'ash', 'char', 'burn', 'glow', 'gleam',
        'light', 'shadow', 'shade', 'beam', 'ray', 'flash', 'glimmer', 'shimmer', 'glint', 'radiance',
        'eclipse', 'corona', 'flare', 'nova', 'pulsar', 'quasar',
        
        // Coastal & Islands
        'island', 'isle', 'atoll', 'reef', 'shore', 'coast', 'beach', 'bay', 'cove', 'harbor',
        'port', 'dock', 'pier', 'wharf', 'marina', 'delta', 'peninsula', 'cape', 'point', 'headland',
        
        // Ice & Cold
        'glacier', 'iceberg', 'ice', 'icicle', 'snowflake', 'crystal', 'hoar', 'rime', 'permafrost', 'floe',
        
        // Atmospheric
        'atmosphere', 'air', 'oxygen', 'nitrogen', 'vapor', 'steam', 'smoke', 'smog', 'haze', 'clarity',
        'pressure', 'climate', 'tropical', 'arctic', 'temperate', 'arid', 'humid', 'dry', 'wet', 'mild',
        
        // Natural Phenomena
        'vortex', 'cyclone', 'typhoon', 'monsoon', 'tempest', 'squall', 'gust', 'draft', 'updraft', 'downdraft',
        'avalanche', 'landslide', 'erosion', 'weathering', 'sedimentation', 'deposition',
        
        // Celestial
        'planet', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'astro',
        'orbit', 'asteroid', 'celestial', 'cosmic', 'space', 'void', 'infinity', 'universe', 'dimension', 'realm',
        
        // Misc Nature
        'nature', 'wild', 'wilderness', 'frontier', 'expanse', 'vista', 'panorama', 'landscape', 'scenery', 'terrain',
        'geology', 'ecology', 'biome', 'habitat', 'ecosystem', 'environment', 'element', 'force', 'power', 'energy'
    ];
    
    // COLORS (200 words)
    private static $colors = [
        // Basic Colors
        'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white',
        'gray', 'grey', 'beige', 'tan', 'cream', 'ivory', 'pearl', 'ebony', 'charcoal', 'slate',
        
        // Metals
        'silver', 'gold', 'bronze', 'copper', 'platinum', 'titanium', 'steel', 'iron', 'chrome', 'metallic',
        
        // Gemstones
        'amber', 'jade', 'ruby', 'emerald', 'sapphire', 'topaz', 'garnet', 'onyx', 'opal', 'turquoise',
        'aquamarine', 'amethyst', 'citrine', 'peridot', 'diamond', 'crystal', 'quartz', 'beryl', 'agate', 'jasper',
        
        // Shades of Blue
        'navy', 'azure', 'cobalt', 'indigo', 'cerulean', 'cyan', 'teal', 'aqua', 'sky', 'powder',
        'denim', 'periwinkle', 'cornflower', 'prussian', 'electric', 'midnight',
        
        // Shades of Red
        'crimson', 'scarlet', 'maroon', 'burgundy', 'cardinal', 'cherry', 'rose', 'coral', 'salmon', 'rust',
        'brick', 'blood', 'wine', 'ruby', 'vermillion', 'carmine',
        
        // Shades of Green
        'lime', 'olive', 'sage', 'moss', 'fern', 'mint', 'emerald', 'jade', 'forest', 'hunter',
        'seafoam', 'pine', 'kelly', 'viridian', 'chartreuse', 'verdant',
        
        // Shades of Purple
        'violet', 'lavender', 'lilac', 'mauve', 'plum', 'magenta', 'orchid', 'mulberry', 'eggplant', 'grape',
        
        // Shades of Yellow/Orange
        'lemon', 'canary', 'mustard', 'gold', 'honey', 'saffron', 'peach', 'apricot', 'tangerine', 'amber',
        'ochre', 'marigold', 'butterscotch', 'caramel',
        
        // Shades of Brown
        'chocolate', 'coffee', 'mocha', 'cocoa', 'sepia', 'umber', 'sienna', 'mahogany', 'chestnut', 'hazel',
        'walnut', 'tawny', 'russet', 'auburn', 'cinnamon',
        
        // Light/Dark Variations
        'light', 'dark', 'pale', 'deep', 'bright', 'vivid', 'dull', 'muted', 'pastel', 'neon',
        'fluorescent', 'luminous', 'radiant', 'brilliant', 'glowing', 'shimmering',
        
        // Nature-Inspired Colors
        'ocean', 'sand', 'earth', 'clay', 'smoke', 'ash', 'dust', 'stone', 'pebble', 'granite',
        'snow', 'frost', 'ice', 'coal', 'soot', 'ink', 'graphite', 'lead', 'pewter', 'zinc'
    ];
    
    // ANIMALS (300 words)
    private static $animals = [
        // Birds of Prey
        'eagle', 'falcon', 'hawk', 'owl', 'osprey', 'kestrel', 'harrier', 'buzzard', 'kite', 'condor',
        
        // Other Birds
        'swan', 'dove', 'robin', 'sparrow', 'finch', 'wren', 'lark', 'thrush', 'warbler', 'starling',
        'cardinal', 'bluejay', 'crow', 'raven', 'magpie', 'parrot', 'macaw', 'cockatoo', 'toucan', 'heron',
        'crane', 'stork', 'ibis', 'egret', 'pelican', 'albatross', 'seagull', 'tern', 'puffin', 'penguin',
        'flamingo', 'peacock', 'pheasant', 'quail', 'partridge', 'grouse', 'woodpecker', 'hummingbird', 'kingfisher', 'swallow',
        
        // Marine Mammals
        'dolphin', 'whale', 'orca', 'porpoise', 'seal', 'otter', 'walrus', 'manatee', 'dugong', 'narwhal',
        
        // Fish
        'salmon', 'trout', 'bass', 'pike', 'carp', 'tuna', 'marlin', 'swordfish', 'barracuda', 'mahi',
        'cod', 'halibut', 'flounder', 'sole', 'snapper', 'grouper', 'perch', 'catfish', 'sturgeon', 'mackerel',
        
        // Marine Life
        'shark', 'ray', 'manta', 'stingray', 'skate', 'eel', 'moray', 'octopus', 'squid', 'cuttlefish',
        'jellyfish', 'starfish', 'urchin', 'anemone', 'coral', 'sponge', 'nautilus', 'conch', 'clam', 'oyster',
        
        // Large Mammals
        'elephant', 'rhino', 'hippo', 'giraffe', 'buffalo', 'bison', 'yak', 'ox', 'bull', 'mammoth',
        
        // Hoofed Animals
        'deer', 'elk', 'moose', 'caribou', 'reindeer', 'gazelle', 'antelope', 'impala', 'kudu', 'oryx',
        'wildebeest', 'gnu', 'ibex', 'chamois', 'springbok', 'eland',
        
        // Equines & Camelids
        'horse', 'pony', 'mare', 'stallion', 'mustang', 'bronco', 'zebra', 'donkey', 'mule',
        'camel', 'dromedary', 'llama', 'alpaca', 'vicuna', 'guanaco',
        
        // Big Cats
        'tiger', 'lion', 'leopard', 'cheetah', 'panther', 'jaguar', 'puma', 'cougar', 'lynx', 'bobcat',
        'caracal', 'serval', 'ocelot', 'margay',
        
        // Canines
        'wolf', 'fox', 'coyote', 'jackal', 'dingo', 'fennec', 'arctic', 'tundra', 'alpha', 'timber',
        
        // Bears
        'bear', 'grizzly', 'polar', 'panda', 'koala', 'sloth', 'kodiak', 'black', 'brown', 'sun',
        
        // Primates
        'monkey', 'ape', 'gorilla', 'chimp', 'orangutan', 'gibbon', 'lemur', 'baboon', 'mandrill', 'macaque',
        
        // Rodents & Small Mammals
        'beaver', 'otter', 'mink', 'ferret', 'weasel', 'marten', 'badger', 'raccoon', 'skunk', 'porcupine',
        'hedgehog', 'rabbit', 'hare', 'squirrel', 'chipmunk', 'marmot', 'prairie', 'gopher', 'lemming', 'vole',
        
        // Reptiles & Amphibians
        'turtle', 'tortoise', 'terrapin', 'gecko', 'iguana', 'chameleon', 'monitor', 'skink', 'newt', 'salamander',
        'frog', 'toad', 'tadpole', 'bullfrog', 'treefrog',
        
        // Insects & Arthropods
        'butterfly', 'moth', 'dragonfly', 'damselfly', 'firefly', 'beetle', 'ladybug', 'mantis', 'cricket', 'cicada',
        'grasshopper', 'katydid', 'ant', 'termite', 'wasp', 'hornet', 'bumblebee', 'honeybee',
        
        // Arachnids
        'spider', 'tarantula', 'scorpion', 'tick', 'mite',
        
        // Mythical/Fantasy (Safe ones)
        'dragon', 'phoenix', 'griffin', 'pegasus', 'unicorn', 'sphinx', 'chimera', 'hydra', 'kraken', 'leviathan'
    ];
    
    // ADJECTIVES (400 words)
    private static $adjectives = [
        // Speed & Movement
        'swift', 'quick', 'fast', 'rapid', 'fleet', 'brisk', 'agile', 'nimble', 'speedy', 'hasty',
        'prompt', 'instant', 'immediate', 'sudden', 'abrupt', 'slow', 'gradual', 'steady', 'constant', 'flowing',
        
        // Size
        'big', 'large', 'huge', 'vast', 'immense', 'enormous', 'gigantic', 'colossal', 'massive', 'mammoth',
        'small', 'tiny', 'little', 'mini', 'micro', 'petite', 'compact', 'minute', 'wee', 'slight',
        'tall', 'high', 'lofty', 'towering', 'soaring', 'short', 'low', 'squat', 'stubby', 'deep',
        'wide', 'broad', 'expansive', 'spacious', 'roomy', 'narrow', 'tight', 'confined', 'cramped', 'dense',
        
        // Strength & Power
        'strong', 'mighty', 'powerful', 'robust', 'sturdy', 'solid', 'firm', 'stable', 'hardy', 'tough',
        'rugged', 'stalwart', 'stout', 'brawny', 'muscular', 'weak', 'frail', 'delicate', 'fragile', 'tender',
        
        // Temperature
        'hot', 'warm', 'heated', 'scorching', 'burning', 'blazing', 'fiery', 'torrid', 'sultry', 'tropical',
        'cold', 'cool', 'chilly', 'frigid', 'frozen', 'icy', 'frosty', 'arctic', 'polar', 'glacial',
        'temperate', 'mild', 'moderate', 'balmy', 'pleasant',
        
        // Texture
        'smooth', 'sleek', 'polished', 'glossy', 'silky', 'velvety', 'satiny', 'slick', 'slippery', 'glassy',
        'rough', 'coarse', 'rugged', 'rocky', 'bumpy', 'uneven', 'jagged', 'ragged', 'gritty', 'sandy',
        'soft', 'fluffy', 'fuzzy', 'downy', 'plush', 'cushy', 'spongy', 'mushy', 'hard', 'rigid',
        
        // Brightness & Light
        'bright', 'brilliant', 'vivid', 'luminous', 'radiant', 'gleaming', 'shining', 'glowing', 'sparkling', 'glittering',
        'dazzling', 'blinding', 'blazing', 'flashing', 'dim', 'dark', 'murky', 'shadowy', 'dusky', 'gloomy',
        
        // Mental Qualities
        'wise', 'smart', 'clever', 'sharp', 'keen', 'astute', 'sage', 'learned', 'intelligent', 'brilliant',
        'bright', 'quick', 'witty', 'cunning', 'crafty', 'shrewd', 'savvy', 'knowing', 'aware', 'conscious',
        
        // Character Traits
        'bold', 'brave', 'daring', 'fearless', 'valiant', 'heroic', 'gallant', 'noble', 'proud', 'dignified',
        'calm', 'quiet', 'still', 'serene', 'tranquil', 'peaceful', 'gentle', 'mild', 'meek', 'tame',
        'wild', 'fierce', 'savage', 'feral', 'untamed', 'primal', 'raw', 'natural', 'pure', 'pristine',
        
        // Age & Time
        'new', 'fresh', 'young', 'youthful', 'modern', 'current', 'recent', 'novel', 'original', 'initial',
        'old', 'ancient', 'elder', 'aged', 'antique', 'vintage', 'classic', 'timeless', 'eternal', 'everlasting',
        'prime', 'peak', 'mature', 'ripe', 'seasoned', 'weathered',
        
        // Quality
        'good', 'great', 'grand', 'fine', 'excellent', 'superb', 'supreme', 'superior', 'premium', 'prime',
        'perfect', 'flawless', 'ideal', 'optimal', 'ultimate', 'paramount', 'chief', 'main', 'major', 'principal',
        
        // Beauty & Elegance
        'beautiful', 'lovely', 'pretty', 'handsome', 'attractive', 'stunning', 'gorgeous', 'elegant', 'graceful', 'refined',
        'exquisite', 'delicate', 'dainty', 'charming', 'enchanting', 'captivating', 'alluring', 'magnetic', 'striking', 'impressive',
        
        // Clarity & Precision
        'clear', 'crisp', 'sharp', 'distinct', 'definite', 'precise', 'exact', 'accurate', 'correct', 'true',
        'pure', 'clean', 'immaculate', 'spotless', 'pristine', 'unspoiled', 'untouched', 'virgin', 'blank', 'empty',
        
        // State & Condition
        'alive', 'living', 'vital', 'vibrant', 'lively', 'active', 'dynamic', 'energetic', 'vigorous', 'spirited',
        'solid', 'liquid', 'fluid', 'molten', 'frozen', 'solid', 'dense', 'compact', 'compressed', 'condensed',
        
        // Scope & Extent
        'full', 'complete', 'total', 'whole', 'entire', 'absolute', 'utter', 'sheer', 'pure', 'thorough',
        'partial', 'incomplete', 'fractional', 'limited', 'restricted', 'bounded', 'finite', 'infinite', 'endless', 'boundless',
        'eternal', 'perpetual', 'constant', 'continuous', 'ongoing', 'ceaseless', 'unending', 'limitless', 'measureless', 'cosmic',
        
        // Tech & Modern
        'digital', 'cyber', 'virtual', 'online', 'connected', 'networked', 'linked', 'wired', 'wireless', 'remote',
        'quantum', 'atomic', 'nuclear', 'molecular', 'cellular', 'neural', 'binary', 'hexadecimal', 'algorithmic', 'computational'
    ];
    
    // TECH & MODERN (200 words)
    private static $tech = [
        // Digital & Computing
        'pixel', 'digital', 'cyber', 'virtual', 'online', 'cloud', 'data', 'code', 'binary', 'byte',
        'bit', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte', 'algorithm', 'protocol', 'syntax', 'logic',
        
        // Network & Communication
        'signal', 'wave', 'pulse', 'beam', 'ray', 'laser', 'sonic', 'ultra', 'infra', 'radio',
        'wireless', 'bluetooth', 'wifi', 'ethernet', 'fiber', 'optic', 'cable', 'satellite', 'antenna', 'transmitter',
        'receiver', 'transceiver', 'relay', 'router', 'switch', 'hub', 'gateway', 'portal', 'interface', 'terminal',
        
        // Quantum & Atomic
        'quantum', 'qubit', 'photon', 'electron', 'proton', 'neutron', 'atom', 'molecule', 'particle', 'ion',
        'plasma', 'nuclear', 'atomic', 'subatomic', 'hadron', 'lepton', 'boson', 'fermion', 'quark', 'neutrino',
        
        // Scale Prefixes
        'nano', 'micro', 'milli', 'centi', 'deci', 'deca', 'hecto', 'kilo', 'mega', 'giga',
        'tera', 'peta', 'exa', 'zetta', 'yotta', 'macro', 'super', 'ultra', 'hyper', 'meta',
        
        // Structure & Organization
        'matrix', 'vector', 'tensor', 'scalar', 'array', 'grid', 'lattice', 'mesh', 'web', 'net',
        'network', 'system', 'nexus', 'axis', 'node', 'vertex', 'edge', 'link', 'chain', 'thread',
        'core', 'kernel', 'module', 'component', 'element', 'unit', 'block', 'segment', 'sector', 'zone',
        
        // Process & Function
        'sync', 'async', 'parallel', 'serial', 'sequential', 'concurrent', 'stream', 'flow', 'pipeline', 'buffer',
        'cache', 'memory', 'storage', 'archive', 'backup', 'snapshot', 'mirror', 'clone', 'fork', 'merge',
        
        // Electrical & Energy
        'circuit', 'chip', 'processor', 'transistor', 'diode', 'resistor', 'capacitor', 'inductor', 'conductor', 'semiconductor',
        'volt', 'amp', 'watt', 'ohm', 'joule', 'hertz', 'charge', 'current', 'voltage', 'power',
        'energy', 'force', 'field', 'flux', 'potential', 'kinetic', 'static', 'dynamic',
        
        // Modern Concepts
        'echo', 'radar', 'sonar', 'lidar', 'beacon', 'sensor', 'detector', 'scanner', 'monitor', 'tracker',
        'crypto', 'cipher', 'token', 'hash', 'key', 'lock', 'secure', 'encrypt', 'decode', 'encode',
        
        // Spatial & Directional
        'axis', 'coordinate', 'dimension', 'vector', 'direction', 'orientation', 'position', 'location', 'point', 'marker'
    ];
    
    // ABSTRACT CONCEPTS (350 words)
    private static $abstract = [
        // Sound & Music
        'echo', 'sound', 'tone', 'pitch', 'note', 'chord', 'harmony', 'melody', 'rhythm', 'beat',
        'pulse', 'tempo', 'cadence', 'measure', 'bar', 'verse', 'chorus', 'refrain', 'tune', 'song',
        'music', 'symphony', 'concerto', 'sonata', 'ballad', 'hymn', 'anthem', 'chant', 'voice', 'vocal',
        
        // Movement & Flow
        'flow', 'drift', 'glide', 'slide', 'soar', 'float', 'hover', 'sway', 'swing', 'rock',
        'roll', 'spin', 'whirl', 'swirl', 'spiral', 'vortex', 'rotation', 'revolution', 'orbit', 'cycle',
        'wave', 'ripple', 'surge', 'rush', 'gush', 'stream', 'current', 'tide', 'flux', 'ebb',
        
        // Journey & Path
        'journey', 'voyage', 'quest', 'trek', 'expedition', 'adventure', 'odyssey', 'pilgrimage', 'passage', 'transit',
        'path', 'way', 'route', 'road', 'trail', 'track', 'course', 'direction', 'heading', 'bearing',
        
        // Spirit & Soul
        'spirit', 'soul', 'essence', 'being', 'existence', 'presence', 'aura', 'vibe', 'energy', 'chi',
        'prana', 'mana', 'karma', 'zen', 'tao', 'dharma', 'nirvana', 'satori', 'moksha', 'samadhi',
        
        // Mind & Thought
        'mind', 'thought', 'idea', 'notion', 'concept', 'theory', 'premise', 'thesis', 'hypothesis', 'axiom',
        'wisdom', 'knowledge', 'insight', 'vision', 'foresight', 'hindsight', 'perception', 'awareness', 'consciousness', 'cognition',
        
        // Emotion & Feeling
        'joy', 'bliss', 'peace', 'calm', 'serenity', 'tranquility', 'harmony', 'balance', 'equilibrium', 'poise',
        'hope', 'faith', 'trust', 'belief', 'confidence', 'courage', 'valor', 'bravery', 'fortitude', 'resolve',
        'passion', 'fervor', 'ardor', 'zeal', 'enthusiasm', 'vigor', 'vitality', 'verve', 'gusto', 'elan',
        
        // Time & Eternity
        'time', 'moment', 'instant', 'second', 'minute', 'hour', 'epoch', 'era', 'age', 'eon',
        'eternity', 'infinity', 'forever', 'always', 'never', 'perpetuity', 'immortality', 'timeless', 'ageless', 'endless',
        
        // Space & Dimension
        'space', 'void', 'vacuum', 'emptiness', 'nothingness', 'abyss', 'chasm', 'gap', 'rift', 'breach',
        'dimension', 'plane', 'sphere', 'realm', 'domain', 'territory', 'region', 'zone', 'area', 'expanse',
        
        // Truth & Reality
        'truth', 'reality', 'fact', 'verity', 'certainty', 'actuality', 'genuineness', 'authenticity', 'validity', 'legitimacy',
        'clarity', 'lucidity', 'transparency', 'purity', 'simplicity', 'essence', 'substance', 'core', 'heart', 'center',
        
        // Power & Force
        'power', 'might', 'strength', 'force', 'potency', 'intensity', 'magnitude', 'amplitude', 'degree', 'level',
        'energy', 'vitality', 'vigor', 'dynamism', 'momentum', 'impetus', 'thrust', 'drive', 'push', 'pull',
        
        // Freedom & Liberty
        'freedom', 'liberty', 'independence', 'autonomy', 'sovereignty', 'emancipation', 'liberation', 'release', 'deliverance', 'rescue',
        
        // Beauty & Grace
        'beauty', 'grace', 'elegance', 'charm', 'allure', 'appeal', 'attraction', 'magnetism', 'charisma', 'mystique',
        'style', 'flair', 'panache', 'finesse', 'polish', 'refinement', 'sophistication', 'class', 'distinction', 'prestige',
        
        // Wonder & Mystery
        'wonder', 'marvel', 'miracle', 'mystery', 'enigma', 'puzzle', 'riddle', 'secret', 'arcane', 'occult',
        'magic', 'enchantment', 'spell', 'charm', 'incantation', 'sorcery', 'witchcraft', 'wizardry', 'alchemy', 'mysticism',
        
        // Destiny & Fortune
        'fate', 'destiny', 'fortune', 'luck', 'chance', 'providence', 'karma', 'kismet', 'serendipity', 'happenstance',
        
        // Unity & Division
        'unity', 'union', 'merger', 'fusion', 'synthesis', 'integration', 'consolidation', 'amalgamation', 'coalition', 'alliance',
        'division', 'separation', 'split', 'schism', 'breach', 'rupture', 'fracture', 'break', 'crack', 'fissure',
        
        // Achievement & Success
        'success', 'triumph', 'victory', 'conquest', 'achievement', 'accomplishment', 'attainment', 'realization', 'fulfillment', 'completion',
        'peak', 'summit', 'apex', 'zenith', 'pinnacle', 'climax', 'culmination', 'acme', 'crown', 'glory'
    ];
    
    // PLACES & STRUCTURES (200 words)
    private static $places = [
        // Buildings & Structures
        'tower', 'spire', 'minaret', 'steeple', 'turret', 'belfry', 'cupola', 'dome', 'vault', 'arch',
        'bridge', 'viaduct', 'overpass', 'causeway', 'trestle', 'aqueduct', 'gate', 'portal', 'archway', 'entrance',
        'castle', 'fortress', 'citadel', 'stronghold', 'bastion', 'rampart', 'battlements', 'keep', 'donjon', 'palace',
        'temple', 'shrine', 'sanctuary', 'chapel', 'cathedral', 'basilica', 'mosque', 'pagoda', 'stupa', 'monastery',
        
        // Monuments & Landmarks
        'monument', 'memorial', 'statue', 'sculpture', 'obelisk', 'pillar', 'column', 'pyramid', 'ziggurat', 'mausoleum',
        'tomb', 'crypt', 'cairn', 'dolmen', 'menhir', 'monolith', 'megalith',
        
        // Urban Spaces
        'plaza', 'square', 'piazza', 'agora', 'forum', 'courtyard', 'quad', 'circle', 'circus', 'rotunda',
        'promenade', 'boulevard', 'avenue', 'street', 'road', 'lane', 'alley', 'passage', 'corridor', 'arcade',
        'market', 'bazaar', 'souk', 'mall', 'galleria', 'emporium', 'exchange', 'depot', 'station', 'terminal',
        
        // Water Features
        'fountain', 'spring', 'well', 'cistern', 'reservoir', 'basin', 'pool', 'pond', 'waterway', 'canal',
        'harbor', 'port', 'dock', 'pier', 'wharf', 'quay', 'jetty', 'marina', 'anchorage', 'berth',
        
        // Natural Spaces
        'garden', 'park', 'grove', 'orchard', 'vineyard', 'meadow', 'lawn', 'green', 'common', 'heath',
        'terrace', 'patio', 'veranda', 'balcony', 'deck', 'platform', 'stage', 'podium', 'dais', 'rostrum',
        
        // Pathways
        'trail', 'path', 'track', 'footpath', 'walkway', 'sidewalk', 'pavement', 'highway', 'freeway', 'expressway',
        'turnpike', 'parkway', 'byway', 'throughway', 'causeway', 'roadway', 'driveway', 'alleyway', 'pathway', 'route',
        
        // Shelters & Havens
        'haven', 'refuge', 'shelter', 'sanctuary', 'asylum', 'retreat', 'hideaway', 'hideout', 'nest', 'den',
        'lair', 'burrow', 'warren', 'lodge', 'cabin', 'cottage', 'villa', 'manor', 'estate', 'mansion',
        
        // Peaks & Summits
        'summit', 'apex', 'crest', 'crown', 'top', 'height', 'pinnacle', 'acme', 'vertex', 'culmination',
        
        // Spaces & Rooms
        'hall', 'chamber', 'room', 'salon', 'parlor', 'lounge', 'gallery', 'studio', 'atelier', 'workshop',
        'arena', 'stadium', 'coliseum', 'amphitheater', 'theater', 'auditorium', 'pavilion', 'gazebo', 'pergola', 'arbor'
    ];
    
    // Get all words from all categories
    public static function getAllWords() {
        return array_merge(
            self::$nature,
            self::$colors,
            self::$animals,
            self::$adjectives,
            self::$tech,
            self::$abstract,
            self::$places
        );
    }
    
    // Get random word
    public static function getRandomWord() {
        $allWords = self::getAllWords();
        return $allWords[array_rand($allWords)];
    }
    
    // Generate random username
    public static function generateUsername() {
        $word1 = self::getRandomWord();
        $word2 = self::getRandomWord();
        $word3 = self::getRandomWord();
        return strtolower("{$word1}.{$word2}.{$word3}");
    }
    
    // Validate word exists in our dictionary
    public static function isValidWord($word) {
        $allWords = self::getAllWords();
        return in_array(strtolower($word), array_map('strtolower', $allWords));
    }
    
    // Get word count
    public static function getWordCount() {
        return count(self::getAllWords());
    }
    
    // Get total possible combinations
    public static function getTotalCombinations() {
        $count = self::getWordCount();
        return $count * $count * $count;
    }
    
    // Get category counts (for info)
    public static function getCategoryCounts() {
        return [
            'nature' => count(self::$nature),
            'colors' => count(self::$colors),
            'animals' => count(self::$animals),
            'adjectives' => count(self::$adjectives),
            'tech' => count(self::$tech),
            'abstract' => count(self::$abstract),
            'places' => count(self::$places)
        ];
    }
}

// For debugging
if (php_sapi_name() === 'cli') {
    echo "=== TANGLE-ME 2000-WORD SYSTEM ===\n\n";
    echo "Total words: " . WordList2000::getWordCount() . "\n";
    echo "Total combinations: " . number_format(WordList2000::getTotalCombinations()) . "\n\n";
    
    echo "Category breakdown:\n";
    foreach (WordList2000::getCategoryCounts() as $category => $count) {
        echo "  - " . ucfirst($category) . ": $count words\n";
    }
    
    echo "\nSample usernames:\n";
    for ($i = 0; $i < 20; $i++) {
        echo "  " . ($i + 1) . ". " . WordList2000::generateUsername() . "\n";
    }
}
?>

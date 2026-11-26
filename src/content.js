/* Rain Check! game content. In every question the FIRST option is the correct one;
   the engine shuffles options before they are shown. */
var RC = (typeof RC !== 'undefined') ? RC : {};
RC.content = {
  votes: [
    { q: 'Which planet has the most known moons?', o: ['Saturn', 'Jupiter', 'Uranus', 'Neptune'], f: 'Saturn passed Jupiter in 2023.' },
    { q: 'What is the smallest country in the world?', o: ['Vatican City', 'Monaco', 'San Marino', 'Liechtenstein'], f: 'It fits inside the city of Rome.' },
    { q: 'Which element has the chemical symbol Au?', o: ['Gold', 'Silver', 'Aluminum', 'Argon'], f: 'From the Latin word aurum.' },
    { q: 'Which animal has fingerprints so much like ours that they can confuse a crime scene?', o: ['Koala', 'Raccoon', 'Sloth', 'Otter'], f: '' },
    { q: 'In which city would you find the Brandenburg Gate?', o: ['Berlin', 'Vienna', 'Munich', 'Prague'], f: '' },
    { q: 'Which Shakespeare play has three witches in it?', o: ['Macbeth', 'Hamlet', 'King Lear', 'The Tempest'], f: '' },
    { q: 'How many time zones does China officially use?', o: ['1', '3', '4', '5'], f: 'The whole country runs on Beijing time.' },
    { q: 'What is the capital of Canada?', o: ['Ottawa', 'Toronto', 'Montreal', 'Vancouver'], f: '' },
    { q: 'Which is the only U.S. state that touches exactly one other state?', o: ['Maine', 'Florida', 'Washington', 'Rhode Island'], f: 'Maine borders only New Hampshire.' },
    { q: 'Which blood cells carry oxygen around the body?', o: ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma cells'], f: '' },
    { q: 'Who painted "The Starry Night"?', o: ['Vincent van Gogh', 'Claude Monet', 'Pablo Picasso', 'Salvador Dalí'], f: 'He painted it in 1889.' },
    { q: 'Which is the largest desert in the world?', o: ['Antarctica', 'Sahara', 'Gobi', 'Arabian'], f: 'A desert is any place with very little rain or snow.' },
    { q: 'What is a sommelier an expert in?', o: ['Wine', 'Cheese', 'Perfume', 'Chocolate'], f: '' },
    { q: 'Which metal is liquid at room temperature?', o: ['Mercury', 'Lead', 'Tin', 'Zinc'], f: '' },
    { q: 'In what year did the Berlin Wall come down?', o: ['1989', '1979', '1985', '1991'], f: '' },
    { q: 'Which country has the most lakes?', o: ['Canada', 'Russia', 'United States', 'Finland'], f: '' },
    { q: 'In the Harry Potter books, what is the name of Harry\'s owl?', o: ['Hedwig', 'Errol', 'Crookshanks', 'Scabbers'], f: '' },
    { q: 'What is a group of crows called?', o: ['A murder', 'A parliament', 'A gaggle', 'A colony'], f: 'A parliament is a group of owls.' },
    { q: 'Which TV family lived at 1313 Mockingbird Lane?', o: ['The Munsters', 'The Addams Family', 'The Brady Bunch', 'The Jetsons'], f: '' },
    { q: 'In Minecraft, which block do you need to build a Nether portal?', o: ['Obsidian', 'Bedrock', 'Diamond block', 'Netherrack'], f: '' }
  ],

  board: [
    { name: 'Geography', levels: [
      [ { q: 'What is the capital of Australia?', o: ['Canberra', 'Sydney', 'Melbourne', 'Perth'] },
        { q: 'Which is the smallest continent?', o: ['Australia', 'Europe', 'Antarctica', 'South America'] } ],
      [ { q: 'Which country has the most people today?', o: ['India', 'China', 'United States', 'Indonesia'] },
        { q: 'The Strait of Gibraltar separates Spain from which country?', o: ['Morocco', 'Algeria', 'Portugal', 'Tunisia'] } ],
      [ { q: 'Mount Kilimanjaro is in which country?', o: ['Tanzania', 'Kenya', 'Ethiopia', 'Uganda'] },
        { q: 'What is the capital of Turkey?', o: ['Ankara', 'Istanbul', 'Izmir', 'Antalya'] } ],
      [ { q: 'Counting its overseas territories, which country covers the most time zones?', o: ['France', 'Russia', 'United States', 'United Kingdom'] },
        { q: 'Lake Titicaca sits on the border of Peru and which country?', o: ['Bolivia', 'Chile', 'Ecuador', 'Colombia'] } ]
    ] },
    { name: 'Sports', levels: [
      [ { q: 'How many players does a basketball team have on the court?', o: ['5', '4', '6', '7'] },
        { q: 'Which sport is played at Wimbledon?', o: ['Tennis', 'Golf', 'Cricket', 'Polo'] } ],
      [ { q: 'What is a perfect score in ten-pin bowling?', o: ['300', '200', '250', '100'] },
        { q: 'How long is an Olympic swimming pool, in meters?', o: ['50', '25', '75', '100'] } ],
      [ { q: 'Which country has won the most men\'s soccer World Cups?', o: ['Brazil', 'Germany', 'Italy', 'Argentina'] },
        { q: 'In golf, what do you call one stroke under par on a hole?', o: ['Birdie', 'Eagle', 'Bogey', 'Albatross'] } ],
      [ { q: 'Which city hosted the first modern Olympic Games, in 1896?', o: ['Athens', 'Paris', 'London', 'Rome'] },
        { q: 'In baseball, what is it called when a pitcher lets no batter reach base all game?', o: ['A perfect game', 'A no-hitter', 'A shutout', 'A complete game'] } ]
    ] },
    { name: 'Health & Body', levels: [
      [ { q: 'What is the largest organ of the human body?', o: ['Skin', 'Liver', 'Brain', 'Lungs'] },
        { q: 'Which vitamin does your skin make from sunlight?', o: ['Vitamin D', 'Vitamin C', 'Vitamin A', 'Vitamin K'] } ],
      [ { q: 'How many bones does an adult human have?', o: ['206', '106', '306', '186'] },
        { q: 'Which part of the eye gives it its color?', o: ['Iris', 'Pupil', 'Cornea', 'Retina'] } ],
      [ { q: 'Which blood type is called the universal donor?', o: ['O negative', 'AB positive', 'A positive', 'B negative'] },
        { q: 'What is the longest bone in the human body?', o: ['Femur', 'Tibia', 'Humerus', 'Fibula'] } ],
      [ { q: 'Where in the body is the smallest bone?', o: ['The ear', 'The little toe', 'The nose', 'The wrist'] },
        { q: 'Which organ makes insulin?', o: ['Pancreas', 'Liver', 'Kidney', 'Spleen'] } ]
    ] },
    { name: 'In the News 2026', levels: [
      [ { q: 'Which country won the men\'s soccer World Cup this summer?', o: ['Spain', 'Argentina', 'France', 'Brazil'] },
        { q: 'The 2026 World Cup had three host countries: the USA, Mexico and which other?', o: ['Canada', 'Costa Rica', 'Cuba', 'Brazil'] } ],
      [ { q: 'In April, NASA\'s Artemis II flew four astronauts around what?', o: ['The Moon', 'Mars', 'The Sun', 'Venus'] },
        { q: 'Which country hosted the Winter Olympics in February 2026?', o: ['Italy', 'France', 'Japan', 'Canada'] } ],
      [ { q: 'Which team did Spain beat in the World Cup final?', o: ['Argentina', 'France', 'England', 'Portugal'] },
        { q: 'The World Cup final was played in a stadium in which US state?', o: ['New Jersey', 'Texas', 'California', 'Florida'] } ],
      [ { q: 'Who scored the winning goal in the World Cup final?', o: ['Ferran Torres', 'Lamine Yamal', 'Rodri', 'Lionel Messi'] },
        { q: 'In which ocean did the Artemis II crew splash down?', o: ['Pacific', 'Atlantic', 'Indian', 'Arctic'] } ]
    ] },
    { name: 'Golden Oldies', levels: [
      [ { q: 'In what year did people first walk on the Moon?', o: ['1969', '1959', '1965', '1972'] },
        { q: 'Which TV show starred Lucy and Ricky Ricardo?', o: ['I Love Lucy', 'The Honeymooners', 'Bewitched', 'Happy Days'] } ],
      [ { q: 'Which 1969 music festival drew about 400,000 people to a farm in New York?', o: ['Woodstock', 'Monterey Pop', 'Newport', 'Live Aid'] },
        { q: 'What was the first music video played on MTV in 1981?', o: ['Video Killed the Radio Star', 'Thriller', 'Take On Me', 'Billie Jean'] } ],
      [ { q: 'Which singer was known as the Queen of Soul?', o: ['Aretha Franklin', 'Diana Ross', 'Tina Turner', 'Etta James'] },
        { q: 'Which 1942 movie is set around a nightclub called Rick\'s Café Américain?', o: ['Casablanca', 'Gone with the Wind', 'The Maltese Falcon', 'Citizen Kane'] } ],
      [ { q: 'Who was the first American to orbit the Earth, in 1962?', o: ['John Glenn', 'Alan Shepard', 'Neil Armstrong', 'Gus Grissom'] },
        { q: 'Which TV western starred James Arness as Marshal Matt Dillon for 20 seasons?', o: ['Gunsmoke', 'Bonanza', 'Rawhide', 'Wagon Train'] } ]
    ] },
    { name: 'Kid Zone', levels: [
      [ { q: 'How many legs does a spider have?', o: ['8', '6', '10', '12'] },
        { q: 'Which is the largest planet in our solar system?', o: ['Jupiter', 'Saturn', 'Neptune', 'Earth'] } ],
      [ { q: 'What gas do plants take in from the air?', o: ['Carbon dioxide', 'Oxygen', 'Helium', 'Hydrogen'] },
        { q: 'What is the hardest natural substance on Earth?', o: ['Diamond', 'Gold', 'Granite', 'Iron'] } ],
      [ { q: 'What do you call an animal that eats only plants?', o: ['Herbivore', 'Carnivore', 'Omnivore', 'Insectivore'] },
        { q: 'How many sides does a hexagon have?', o: ['6', '5', '7', '8'] } ],
      [ { q: 'What is the closest star to Earth?', o: ['The Sun', 'Proxima Centauri', 'Sirius', 'Polaris'] },
        { q: 'In Minecraft, which three-headed boss do you build from soul sand and skulls?', o: ['The Wither', 'The Ender Dragon', 'The Warden', 'The Elder Guardian'] } ]
    ] }
  ],

  zoom: [
    { id: 'eiffel', o: ['Eiffel Tower', 'Tokyo Tower', 'Space Needle', 'CN Tower'], fx: 50, fy: 62 },
    { id: 'pyramids', o: ['Pyramids of Giza', 'Chichén Itzá', 'Machu Picchu', 'Petra'], fx: 44, fy: 52 },
    { id: 'goldengate', o: ['Golden Gate Bridge', 'Brooklyn Bridge', 'Tower Bridge', 'Sydney Harbour Bridge'], fx: 30, fy: 40 },
    { id: 'taj', o: ['Taj Mahal', 'Hagia Sophia', 'St. Peter\'s Basilica', 'The Alhambra'], fx: 50, fy: 58 },
    { id: 'opera', o: ['Sydney Opera House', 'Guggenheim Museum', 'Burj Al Arab', 'Lotus Temple'], fx: 55, fy: 50 },
    { id: 'pisa', o: ['Leaning Tower of Pisa', 'Colosseum', 'Big Ben', 'Parthenon'], fx: 50, fy: 45 },
    { id: 'bigben', o: ['Big Ben', 'Empire State Building', 'Notre-Dame', 'Kremlin'], fx: 47, fy: 30 },
    { id: 'stonehenge', o: ['Stonehenge', 'Easter Island', 'Great Wall of China', 'Acropolis'], fx: 40, fy: 60 }
  ],

  phrases: [
    { t: 'THE ELEPHANT IN THE ROOM', h: 'Awkward' },
    { t: 'BARKING UP THE WRONG TREE', h: 'Mistaken' },
    { t: 'A BLESSING IN DISGUISE', h: 'Lucky after all' },
    { t: 'BITE OFF MORE THAN YOU CAN CHEW', h: 'Too much' },
    { t: 'THE BEST OF BOTH WORLDS', h: 'Win-win' },
    { t: 'BURNING THE MIDNIGHT OIL', h: 'Working late' },
    { t: 'CURIOSITY KILLED THE CAT', h: 'A warning' },
    { t: 'A PENNY FOR YOUR THOUGHTS', h: 'What is on your mind?' },
    { t: 'THE CALM BEFORE THE STORM', h: 'Weather talk' },
    { t: 'UNDER THE WEATHER', h: 'Feeling sick' },
    { t: 'ACTIONS SPEAK LOUDER THAN WORDS', h: 'Good advice' },
    { t: 'BACK TO THE DRAWING BOARD', h: 'Start over' }
  ],

  /* Survey Says. The numbers are the show's own made-up poll of 1,000 people, not a real survey. */
  surveys: [
    { q: 'Name something a burglar would NOT want to find in your house.', a: [['A big dog', 318], ['An alarm system', 214], ['The owner wide awake', 152], ['Security cameras', 121], ['A police officer', 84], ['Nosy neighbors', 51], ['A light-sleeping grandma', 37], ['A talking parrot', 23]] },
    { q: 'What is the funniest thing that can happen at a family dinner?', a: [['Someone spills a drink', 246], ['A kid says something embarrassing', 221], ['The dog steals food', 173], ['Someone burps loudly', 141], ['Grandpa falls asleep', 96], ['Milk comes out of a nose', 62], ['A chair breaks', 38], ['A silly ringtone goes off', 23]] },
    { q: 'What do people always forget to pack for a trip?', a: [['Phone charger', 302], ['Toothbrush', 251], ['Underwear', 133], ['Socks', 98], ['Sunscreen', 84], ['Medicine', 62], ['Pajamas', 41], ['Umbrella', 29]] },
    { q: 'What is the best thing to do on a rainy day?', a: [['Watch a movie', 287], ['Take a nap', 196], ['Play board games', 158], ['Read a book', 124], ['Bake cookies', 93], ['Play video games', 71], ['Do a puzzle', 42], ['Splash in puddles', 29]] },
    { q: 'Name an excuse kids give for not doing homework.', a: [['I forgot', 263], ['The dog ate it', 218], ['I left it at school', 164], ['I did not understand it', 127], ['I was sick', 92], ['We had no homework', 68], ['The Wi-Fi was down', 41], ['I was too tired', 27]] },
    { q: 'What does every grandparent have in their house?', a: [['Family photos', 294], ['A candy dish', 187], ['A comfy recliner', 156], ['Cookies', 118], ['Reading glasses everywhere', 96], ['A very loud TV', 71], ['Old photo albums', 49], ['A loud ticking clock', 29]] },
    { q: 'Name something people do when they cannot sleep.', a: [['Look at their phone', 281], ['Watch TV', 204], ['Read a book', 163], ['Get a snack', 127], ['Count sheep', 98], ['Toss and turn', 66], ['Drink warm milk', 38], ['Get up and clean', 23]] },
    { q: 'Name something you find at every birthday party.', a: [['Cake', 334], ['Balloons', 198], ['Presents', 162], ['Candles', 104], ['Party hats', 76], ['Singing', 61], ['Ice cream', 42], ['A crying kid', 23]] },
    { q: 'What is the first thing people do when they wake up?', a: [['Check their phone', 312], ['Go to the bathroom', 226], ['Hit snooze', 148], ['Make coffee', 121], ['Brush their teeth', 83], ['Stretch', 54], ['Take a shower', 36], ['Let the dog out', 20]] },
    { q: 'Name something people lose all the time.', a: [['Keys', 296], ['Phone', 214], ['TV remote', 153], ['Glasses', 126], ['Socks', 87], ['Wallet', 64], ['Pens', 37], ['Their patience', 23]] },
    { q: 'Name a food people eat with their hands.', a: [['Pizza', 268], ['Hamburger', 204], ['French fries', 151], ['Tacos', 118], ['Fried chicken', 97], ['Sandwich', 76], ['Hot dog', 54], ['Corn on the cob', 32]] },
    { q: 'Name something you bring to the beach.', a: [['Towel', 274], ['Sunscreen', 226], ['Swimsuit', 141], ['Umbrella', 108], ['Cooler with drinks', 94], ['Sunglasses', 73], ['A good book', 49], ['A beach ball', 35]] }
  ],

  tf: [
    { q: 'Bananas are berries, but strawberries are not.', a: true, f: 'Botanists are strict about what counts as a berry.' },
    { q: 'A day on Venus is longer than a year on Venus.', a: true, f: 'Venus spins very slowly.' },
    { q: 'You can see the Great Wall of China from the Moon with your bare eyes.', a: false, f: 'It is far too narrow to see from that far away.' },
    { q: 'An octopus has three hearts.', a: true, f: 'Two pump blood to the gills, one to the body.' },
    { q: 'People use only 10 percent of their brains.', a: false, f: 'Brain scans show activity all over.' },
    { q: 'Lightning never strikes the same place twice.', a: false, f: 'Tall buildings get hit many times a year.' },
    { q: 'Measured from base to peak, Mount Everest is the tallest mountain on Earth.', a: false, f: 'Mauna Kea in Hawaii is taller from its base on the sea floor.' },
    { q: 'To a botanist, a tomato is a fruit.', a: true, f: 'It grows from a flower and holds seeds.' },
    { q: 'Goldfish only remember things for three seconds.', a: false, f: 'They can remember for months.' },
    { q: 'Adults have more bones than babies.', a: false, f: 'Babies have about 300. Many fuse as we grow.' },
    { q: 'Sound travels faster in water than in air.', a: true, f: 'More than four times faster.' },
    { q: 'Sharks have been around longer than trees.', a: true, f: 'Sharks go back about 450 million years.' },
    { q: 'Napoleon was unusually short for his time.', a: false, f: 'He was about average height. Cartoons made him tiny.' },
    { q: 'Honey can last for thousands of years without spoiling.', a: true, f: '' },
    { q: 'Bats are blind.', a: false, f: 'All bats can see. Many also find their way by echoes.' },
    { q: 'The U.S. state closest to Africa is Maine.', a: true, f: 'Maine reaches farther east than Florida.' }
  ],

  decades: [
    { q: 'The Berlin Wall was built.', o: ['1960s', '1940s', '1950s', '1970s'] },
    { q: 'The first email was sent.', o: ['1970s', '1960s', '1980s', '1990s'] },
    { q: 'The movie "Jaws" opened in theaters.', o: ['1970s', '1960s', '1980s', '1990s'] },
    { q: 'The Chernobyl nuclear accident happened.', o: ['1980s', '1960s', '1970s', '1990s'] },
    { q: 'The Titanic sank.', o: ['1910s', '1900s', '1920s', '1930s'] },
    { q: 'The first Super Bowl was played.', o: ['1960s', '1940s', '1950s', '1970s'] },
    { q: 'The Hubble Space Telescope was launched.', o: ['1990s', '1970s', '1980s', '2000s'] },
    { q: 'Sliced bread was first sold in stores.', o: ['1920s', '1900s', '1910s', '1930s'] },
    { q: 'The first Harry Potter book was published.', o: ['1990s', '1980s', '2000s', '2010s'] },
    { q: 'Facebook was launched.', o: ['2000s', '1990s', '2010s', '1980s'] },
    { q: 'The Wright brothers made their first powered flight.', o: ['1900s', '1890s', '1910s', '1920s'] },
    { q: 'The first Toy Story movie opened in theaters.', o: ['1990s', '1980s', '2000s', '2010s'] },
    { q: 'The Rubik\'s Cube went on sale around the world.', o: ['1980s', '1960s', '1970s', '1990s'] },
    { q: 'Disney released Frozen.', o: ['2010s', '1990s', '2000s', '2020s'] },
    { q: 'The Beatles first played The Ed Sullivan Show.', o: ['1960s', '1950s', '1970s', '1980s'] }
  ],

  likely: [
    'fall asleep during a movie', 'win a dance contest', 'get lost even with the GPS on', 'eat dessert before dinner',
    'start talking to a stranger in line', 'forget where the car is parked', 'become famous one day', 'survive on a desert island',
    'sing loudly in the shower', 'laugh at the wrong moment', 'burn the toast', 'be the last one ready to leave',
    'cry at a commercial', 'win this game', 'tell the same story twice', 'pack three suitcases for a weekend'
  ],

  numbers: [
    { q: 'How many bones are in the adult human body?', a: 206 },
    { q: 'How many feet are in a mile?', a: 5280 },
    { q: 'How many minutes are in one day?', a: 1440 },
    { q: 'In what year did the Titanic sink?', a: 1912, y: true },
    { q: 'How many keys does a piano have?', a: 88 },
    { q: 'How many dots are on a pair of dice?', a: 42 },
    { q: 'How tall is Mount Everest, in feet?', a: 29032 },
    { q: 'In what year did the Berlin Wall come down?', a: 1989, y: true },
    { q: 'How many countries are members of the United Nations?', a: 193 },
    { q: 'How many elements are on the periodic table?', a: 118 },
    { q: 'About how many miles is it from the Earth to the Moon?', a: 238855 },
    { q: 'In what year did the first iPhone go on sale?', a: 2007, y: true },
    { q: 'How many pieces does each player start with in chess?', a: 16 },
    { q: 'How many days does the Moon take to circle the Earth, to the nearest day?', a: 27 },
    { q: 'How many seats are in the U.S. House of Representatives?', a: 435 },
    { q: 'In what year did World War II end?', a: 1945, y: true }
  ],

  words: [
    { w: 'MICROSCOPE', h: 'Science lab' },
    { w: 'HURRICANE', h: 'Big storm' },
    { w: 'ORCHESTRA', h: 'Music' },
    { w: 'KANGAROO', h: 'Animal' },
    { w: 'ADVENTURE', h: 'Exciting trip' },
    { w: 'CHOCOLATE', h: 'Sweet' },
    { w: 'TELESCOPE', h: 'Stargazing' },
    { w: 'LIGHTNING', h: 'Storm flash' },
    { w: 'BUTTERFLY', h: 'Insect' },
    { w: 'SPAGHETTI', h: 'Dinner' },
    { w: 'PASSPORT', h: 'Travel' },
    { w: 'TRAMPOLINE', h: 'Bounce' },
    { w: 'CROCODILE', h: 'Animal' },
    { w: 'FIREPLACE', h: 'Cozy' },
    { w: 'RESTAURANT', h: 'Eating out' },
    { w: 'MOSQUITO', h: 'Summer pest' }
  ],

  /* Crillion. Every question has many right answers, so the room does not pile onto the same few.
     Each answer: [name, how many people out of 100 would say it, other spellings].
     The counts are the show's own estimates, not a real survey. "no" lists common wrong answers and why. */
  crillion: [
    { q: 'Name a country in Europe.',
      a: [['France', 78], ['Italy', 72], ['Spain', 70], ['Germany', 68], ['United Kingdom', 55, ['uk', 'britain', 'great britain', 'england', 'scotland', 'wales']], ['Greece', 44], ['Portugal', 42], ['Ireland', 40], ['Netherlands', 36, ['holland']], ['Switzerland', 35], ['Sweden', 33], ['Poland', 30], ['Norway', 28], ['Belgium', 26], ['Austria', 25], ['Russia', 24], ['Denmark', 22], ['Ukraine', 21], ['Finland', 18], ['Iceland', 16], ['Croatia', 14], ['Czech Republic', 13, ['czechia']], ['Hungary', 12], ['Turkey', 12, ['turkiye']], ['Romania', 11], ['Bulgaria', 8], ['Serbia', 7], ['Slovakia', 6], ['Luxembourg', 6], ['Monaco', 6], ['Slovenia', 5], ['Lithuania', 5], ['Latvia', 5], ['Estonia', 5], ['Malta', 5], ['Albania', 4], ['Bosnia and Herzegovina', 4, ['bosnia']], ['Belarus', 4], ['Cyprus', 4], ['Vatican City', 4, ['vatican']], ['Montenegro', 3], ['North Macedonia', 3, ['macedonia']], ['Liechtenstein', 3], ['Kosovo', 3], ['Moldova', 2], ['Andorra', 2], ['San Marino', 2]],
      no: [['Australia', 'Australia is its own continent. You may be thinking of Austria.'], ['Egypt', 'Egypt is in Africa.'], ['Israel', 'Israel is in Asia.'], ['Morocco', 'Morocco is in Africa.'], ['Canada', 'Canada is in North America.'], ['Greenland', 'Greenland belongs to Denmark, but it is not a country in Europe.'], ['Europe', 'Europe is the continent. Name a country in it.'], ['Paris', 'Paris is a city.'], ['London', 'London is a city.']] },
    { q: 'Name a country in Africa.',
      a: [['Egypt', 70], ['South Africa', 66], ['Kenya', 52], ['Nigeria', 50], ['Morocco', 40], ['Ethiopia', 36], ['Ghana', 30], ['Madagascar', 28], ['Uganda', 22], ['Tanzania', 22], ['Zimbabwe', 20], ['Congo', 20, ['democratic republic of the congo', 'dr congo', 'drc', 'republic of the congo', 'zaire']], ['Algeria', 16], ['Libya', 16], ['Sudan', 15], ['Somalia', 15], ['Rwanda', 14], ['Senegal', 13], ['Tunisia', 13], ['Cameroon', 12], ['Angola', 11], ['Zambia', 10], ['Mali', 10], ['Ivory Coast', 9, ['cote divoire']], ['Mozambique', 9], ['Botswana', 9], ['Namibia', 9], ['Chad', 8], ['Niger', 8], ['Liberia', 7], ['Sierra Leone', 6], ['South Sudan', 5], ['Malawi', 5], ['Togo', 4], ['Gabon', 4], ['Gambia', 4], ['Guinea', 4], ['Burkina Faso', 4], ['Benin', 3], ['Mauritania', 3], ['Burundi', 3], ['Eritrea', 3], ['Djibouti', 3], ['Lesotho', 3], ['Seychelles', 3], ['Mauritius', 3], ['Eswatini', 2, ['swaziland']], ['Cape Verde', 2, ['cabo verde']], ['Comoros', 2], ['Equatorial Guinea', 2], ['Guinea-Bissau', 2, ['guinea bissau']], ['Central African Republic', 2], ['Sao Tome and Principe', 2, ['sao tome']]],
      no: [['Africa', 'Africa is the continent. Name a country in it.'], ['India', 'India is in Asia.'], ['Brazil', 'Brazil is in South America.'], ['Jamaica', 'Jamaica is in the Caribbean.'], ['Haiti', 'Haiti is in the Caribbean.'], ['Saudi Arabia', 'Saudi Arabia is in Asia.'], ['Israel', 'Israel is in Asia.'], ['Zanzibar', 'Zanzibar is part of Tanzania.'], ['Yemen', 'Yemen is in Asia.'], ['Guyana', 'Guyana is in South America.']] },
    { q: 'Name a country in Asia.',
      a: [['China', 75], ['Japan', 72], ['India', 65], ['South Korea', 40, ['korea']], ['Thailand', 38], ['Vietnam', 36], ['Philippines', 30], ['Indonesia', 24], ['Singapore', 22], ['North Korea', 22], ['Russia', 20], ['Pakistan', 20], ['Iran', 18], ['Iraq', 18], ['Saudi Arabia', 16], ['Israel', 16], ['Afghanistan', 15], ['Turkey', 12, ['turkiye']], ['Malaysia', 12], ['Nepal', 12], ['Mongolia', 11], ['Taiwan', 11], ['Bangladesh', 9], ['Sri Lanka', 8], ['Cambodia', 8], ['United Arab Emirates', 8, ['uae', 'emirates']], ['Qatar', 6], ['Kazakhstan', 6], ['Syria', 6], ['Myanmar', 5, ['burma']], ['Laos', 5], ['Jordan', 5], ['Lebanon', 5], ['Kuwait', 4], ['Yemen', 4], ['Oman', 3], ['Bhutan', 3], ['Uzbekistan', 3], ['Maldives', 3], ['Georgia', 3], ['Armenia', 3], ['Azerbaijan', 3], ['Palestine', 3], ['Bahrain', 2], ['Brunei', 2], ['Kyrgyzstan', 2], ['Tajikistan', 2], ['Turkmenistan', 2], ['East Timor', 2, ['timor leste']], ['Cyprus', 2]],
      no: [['Asia', 'Asia is the continent. Name a country in it.'], ['Australia', 'Australia is its own continent.'], ['Egypt', 'Egypt is in Africa.'], ['Hong Kong', 'Hong Kong is a region of China, not a country.'], ['Dubai', 'Dubai is a city in the United Arab Emirates.'], ['Tokyo', 'Tokyo is a city.'], ['Bali', 'Bali is an island in Indonesia.'], ['Hawaii', 'Hawaii is a U.S. state.'], ['Tibet', 'Tibet is a region of China, not a country.']] },
    { q: 'Name one of the 50 U.S. states.',
      a: [['California', 62], ['Florida', 60], ['Texas', 58], ['New York', 55], ['Hawaii', 35], ['Alaska', 33], ['Georgia', 22], ['Ohio', 20], ['Arizona', 20], ['Colorado', 20], ['Nevada', 18], ['Washington', 18], ['Illinois', 17], ['Pennsylvania', 17], ['Michigan', 16], ['New Jersey', 16], ['Virginia', 15], ['North Carolina', 15], ['Massachusetts', 15], ['Tennessee', 14], ['Oregon', 13], ['Louisiana', 13], ['Utah', 12], ['Montana', 11], ['Maine', 11], ['Kentucky', 11], ['Alabama', 11], ['Minnesota', 10], ['Wisconsin', 10], ['Missouri', 10], ['South Carolina', 10], ['Indiana', 9], ['Maryland', 9], ['Oklahoma', 9], ['Kansas', 9], ['Mississippi', 9], ['Iowa', 8], ['Idaho', 8], ['New Mexico', 8], ['Connecticut', 8], ['Arkansas', 7], ['Wyoming', 7], ['Vermont', 7], ['Nebraska', 6], ['West Virginia', 6], ['New Hampshire', 6], ['Rhode Island', 6], ['Delaware', 6], ['North Dakota', 5], ['South Dakota', 5]],
      no: [['Puerto Rico', 'Puerto Rico is a U.S. territory, not a state.'], ['Washington DC', 'Washington, D.C. is a district, not a state.'], ['DC', 'Washington, D.C. is a district, not a state.'], ['Guam', 'Guam is a U.S. territory, not a state.'], ['Mexico', 'New Mexico is a state. Mexico is a country.'], ['Canada', 'Canada is a country.'], ['Miami', 'Miami is a city.'], ['Chicago', 'Chicago is a city.'], ['Dakota', 'Say North Dakota or South Dakota.'], ['Carolina', 'Say North Carolina or South Carolina.']] },
    { q: 'Name a U.S. state capital city.',
      a: [['Boston', 40], ['Atlanta', 38], ['Denver', 36], ['Austin', 34], ['Phoenix', 34], ['Sacramento', 30], ['Nashville', 30], ['Honolulu', 28], ['Albany', 26], ['Salt Lake City', 22], ['Tallahassee', 20], ['Indianapolis', 18], ['Oklahoma City', 16], ['Columbus', 16], ['Raleigh', 14], ['Richmond', 14], ['Baton Rouge', 12], ['Juneau', 12], ['Little Rock', 11], ['Santa Fe', 11], ['Boise', 11], ['Des Moines', 9], ['Madison', 9], ['Saint Paul', 9], ['Springfield', 9], ['Montgomery', 8], ['Lansing', 7], ['Jackson', 7], ['Columbia', 7], ['Charleston', 7], ['Annapolis', 7], ['Hartford', 7], ['Providence', 7], ['Trenton', 6], ['Harrisburg', 6], ['Dover', 6], ['Topeka', 6], ['Lincoln', 6], ['Cheyenne', 6], ['Helena', 5], ['Bismarck', 5], ['Olympia', 5], ['Salem', 5], ['Carson City', 5], ['Pierre', 4], ['Jefferson City', 4], ['Concord', 4], ['Augusta', 4], ['Frankfort', 3], ['Montpelier', 3]],
      no: [['Miami', 'Florida\'s capital is Tallahassee.'], ['Orlando', 'Florida\'s capital is Tallahassee.'], ['Los Angeles', 'California\'s capital is Sacramento.'], ['San Francisco', 'California\'s capital is Sacramento.'], ['New York', 'New York\'s capital is Albany.'], ['New York City', 'New York\'s capital is Albany.'], ['Chicago', 'The capital of Illinois is Springfield.'], ['Houston', 'The capital of Texas is Austin.'], ['Dallas', 'The capital of Texas is Austin.'], ['Las Vegas', 'Nevada\'s capital is Carson City.'], ['Seattle', 'Washington\'s capital is Olympia.'], ['Philadelphia', 'Pennsylvania\'s capital is Harrisburg.'], ['Detroit', 'Michigan\'s capital is Lansing.'], ['New Orleans', 'Louisiana\'s capital is Baton Rouge.'], ['Washington DC', 'That is the national capital, not a state capital.'], ['Portland', 'Oregon\'s capital is Salem and Maine\'s is Augusta.'], ['Anchorage', 'Alaska\'s capital is Juneau.']] },
    { q: 'Name a U.S. president, past or present.',
      a: [['Washington', 70, ['george washington']], ['Lincoln', 68, ['abraham lincoln', 'abe lincoln']], ['Trump', 60, ['donald trump']], ['Obama', 58, ['barack obama']], ['Biden', 50, ['joe biden']], ['Kennedy', 45, ['john f kennedy', 'john kennedy', 'jfk']], ['Bush', 40, ['george bush', 'george w bush', 'george h w bush']], ['Clinton', 38, ['bill clinton']], ['Reagan', 36, ['ronald reagan']], ['Jefferson', 30, ['thomas jefferson']], ['Roosevelt', 28, ['franklin roosevelt', 'franklin d roosevelt', 'fdr', 'teddy roosevelt', 'theodore roosevelt']], ['Nixon', 26, ['richard nixon']], ['Carter', 22, ['jimmy carter']], ['Adams', 14, ['john adams', 'john quincy adams']], ['Eisenhower', 14, ['dwight eisenhower', 'ike']], ['Truman', 12, ['harry truman']], ['Grant', 12, ['ulysses grant', 'ulysses s grant']], ['Jackson', 11, ['andrew jackson']], ['Ford', 10, ['gerald ford']], ['Johnson', 10, ['lyndon johnson', 'lyndon b johnson', 'lbj', 'andrew johnson']], ['Madison', 9, ['james madison']], ['Monroe', 8, ['james monroe']], ['Wilson', 8, ['woodrow wilson']], ['Hoover', 6, ['herbert hoover']], ['Taft', 5, ['william taft', 'william howard taft']], ['Coolidge', 4, ['calvin coolidge']], ['McKinley', 4, ['william mckinley']], ['Garfield', 4, ['james garfield']], ['Cleveland', 4, ['grover cleveland']], ['Harding', 3, ['warren harding']], ['Polk', 3, ['james polk']], ['Van Buren', 3, ['martin van buren']], ['Harrison', 3, ['william henry harrison', 'benjamin harrison']], ['Fillmore', 3, ['millard fillmore']], ['Tyler', 2, ['john tyler']], ['Taylor', 2, ['zachary taylor']], ['Pierce', 2, ['franklin pierce']], ['Buchanan', 2, ['james buchanan']], ['Hayes', 2, ['rutherford hayes', 'rutherford b hayes']], ['Arthur', 2, ['chester arthur', 'chester a arthur']]],
      no: [['Franklin', 'Benjamin Franklin was never president.'], ['Benjamin Franklin', 'Benjamin Franklin was never president.'], ['Hamilton', 'Alexander Hamilton was never president.'], ['Alexander Hamilton', 'Alexander Hamilton was never president.'], ['Martin Luther King', 'Martin Luther King Jr. was never president.'], ['Churchill', 'Winston Churchill was a British prime minister.'], ['Hillary Clinton', 'Hillary Clinton ran but was never president.'], ['Kamala Harris', 'Kamala Harris was vice president.'], ['Al Gore', 'Al Gore was vice president.'], ['Columbus', 'Columbus was an explorer.']] },
    { q: 'Name a team in the NFL.',
      a: [['Cowboys', 55, ['dallas cowboys', 'dallas']], ['Patriots', 45, ['new england patriots', 'new england']], ['Chiefs', 45, ['kansas city chiefs', 'kansas city']], ['Packers', 40, ['green bay packers', 'green bay']], ['Dolphins', 40, ['miami dolphins', 'miami']], ['Eagles', 36, ['philadelphia eagles', 'philadelphia']], ['49ers', 32, ['san francisco 49ers', 'niners', 'forty niners', 'san francisco']], ['Steelers', 32, ['pittsburgh steelers', 'pittsburgh']], ['Giants', 28, ['new york giants']], ['Bears', 26, ['chicago bears', 'chicago']], ['Raiders', 24, ['las vegas raiders', 'oakland raiders', 'las vegas']], ['Broncos', 22, ['denver broncos', 'denver']], ['Buccaneers', 22, ['bucs', 'tampa bay buccaneers', 'tampa bay', 'tampa']], ['Jets', 20, ['new york jets']], ['Bills', 20, ['buffalo bills', 'buffalo']], ['Seahawks', 18, ['seattle seahawks', 'seattle']], ['Rams', 18, ['los angeles rams', 'la rams']], ['Ravens', 18, ['baltimore ravens', 'baltimore']], ['Lions', 17, ['detroit lions', 'detroit']], ['Vikings', 17, ['minnesota vikings', 'minnesota']], ['Saints', 16, ['new orleans saints', 'new orleans']], ['Jaguars', 16, ['jags', 'jacksonville jaguars', 'jacksonville']], ['Falcons', 15, ['atlanta falcons', 'atlanta']], ['Bengals', 14, ['cincinnati bengals', 'cincinnati']], ['Browns', 14, ['cleveland browns', 'cleveland']], ['Chargers', 13, ['los angeles chargers', 'la chargers', 'san diego chargers']], ['Commanders', 12, ['washington commanders', 'washington']], ['Panthers', 12, ['carolina panthers', 'carolina']], ['Colts', 11, ['indianapolis colts', 'indianapolis']], ['Cardinals', 11, ['arizona cardinals', 'arizona']], ['Titans', 10, ['tennessee titans', 'tennessee']], ['Texans', 9, ['houston texans', 'houston']]],
      no: [['Yankees', 'The Yankees play baseball.'], ['Lakers', 'The Lakers play basketball.'], ['Heat', 'The Heat play basketball.'], ['Marlins', 'The Marlins play baseball.'], ['Red Sox', 'The Red Sox play baseball.'], ['Gators', 'The Gators are a college team.'], ['Hurricanes', 'The Hurricanes are a college team.'], ['Oilers', 'The Oilers became the Titans in 1999.'], ['Inter Miami', 'Inter Miami plays soccer.'], ['Bulls', 'The Bulls play basketball.'], ['Dodgers', 'The Dodgers play baseball.']] },
    { q: 'Name a musical instrument.',
      a: [['Guitar', 75, ['acoustic guitar', 'electric guitar']], ['Piano', 72, ['grand piano']], ['Drums', 62, ['drum', 'drum set', 'drum kit', 'snare drum', 'bass drum']], ['Violin', 50, ['fiddle']], ['Flute', 40], ['Trumpet', 38], ['Saxophone', 30, ['sax']], ['Cello', 20], ['Clarinet', 20], ['Trombone', 18], ['Harp', 15], ['Tuba', 14], ['Bass', 14, ['bass guitar', 'double bass', 'upright bass', 'contrabass']], ['Ukulele', 14], ['Banjo', 12], ['Harmonica', 12], ['Keyboard', 10, ['synthesizer', 'synth']], ['Accordion', 9], ['Organ', 9, ['pipe organ']], ['Xylophone', 9], ['Tambourine', 8], ['Oboe', 7], ['Viola', 6], ['French horn', 6, ['horn']], ['Bagpipes', 6, ['bagpipe']], ['Triangle', 6], ['Recorder', 6], ['Mandolin', 4], ['Bongos', 4, ['bongo', 'bongo drums']], ['Maracas', 4, ['maraca']], ['Cymbals', 4, ['cymbal']], ['Piccolo', 3], ['Bassoon', 3], ['Kazoo', 3], ['Cowbell', 3], ['Whistle', 3, ['tin whistle', 'penny whistle']], ['Bells', 3, ['bell', 'handbells']], ['Bugle', 2], ['Sitar', 2], ['Didgeridoo', 2], ['Harpsichord', 2], ['Timpani', 2, ['kettledrum', 'kettle drums']], ['Glockenspiel', 2], ['Marimba', 2], ['Castanets', 2], ['Steel drum', 2, ['steel drums', 'steel pan']], ['Lute', 2], ['Zither', 2], ['Theremin', 2], ['Ocarina', 2], ['Cornet', 2], ['Euphonium', 2], ['Congas', 2, ['conga']], ['Gong', 2], ['Lyre', 2], ['Vibraphone', 2], ['Fife', 2], ['Dulcimer', 2]],
      no: [['Microphone', 'A microphone makes sound louder. It is not an instrument.'], ['Speaker', 'A speaker is not an instrument.'], ['Radio', 'A radio is not an instrument.'], ['Baton', 'That is the conductor\'s stick.'], ['Headphones', 'Headphones are not an instrument.']] },
    { q: 'Name a fruit.',
      a: [['Apple', 80], ['Banana', 75], ['Orange', 65], ['Strawberry', 50], ['Grape', 45, ['grapes']], ['Watermelon', 35], ['Pineapple', 32], ['Mango', 30], ['Peach', 25], ['Pear', 25], ['Cherry', 22, ['cherries']], ['Blueberry', 20, ['blueberries']], ['Lemon', 18], ['Kiwi', 15], ['Raspberry', 12], ['Lime', 10], ['Coconut', 10], ['Plum', 9], ['Grapefruit', 8], ['Pomegranate', 7], ['Papaya', 6], ['Cantaloupe', 6, ['melon', 'muskmelon']], ['Avocado', 6], ['Tomato', 5], ['Apricot', 5], ['Blackberry', 5], ['Fig', 4], ['Tangerine', 4, ['mandarin', 'clementine']], ['Nectarine', 3], ['Honeydew', 3], ['Cranberry', 3], ['Guava', 3], ['Passion fruit', 3], ['Dragon fruit', 3, ['pitaya']], ['Lychee', 2, ['litchi']], ['Date', 2, ['dates']], ['Persimmon', 2], ['Kumquat', 2], ['Starfruit', 2, ['carambola']], ['Plantain', 2], ['Jackfruit', 2], ['Durian', 2], ['Olive', 2], ['Mulberry', 2], ['Gooseberry', 2], ['Elderberry', 2], ['Currant', 2], ['Quince', 2], ['Boysenberry', 2], ['Pumpkin', 2]],
      no: [['Carrot', 'A carrot is a vegetable.'], ['Potato', 'A potato is a vegetable.'], ['Lettuce', 'Lettuce is a vegetable.'], ['Broccoli', 'Broccoli is a vegetable.'], ['Rhubarb', 'Rhubarb is a vegetable.'], ['Peanut', 'A peanut is a legume.'], ['Fruit', 'Name one!']] },
    { q: 'Name a vegetable.',
      a: [['Carrot', 75], ['Broccoli', 62], ['Potato', 50], ['Corn', 40], ['Lettuce', 40], ['Spinach', 34], ['Onion', 32], ['Cucumber', 30], ['Tomato', 28], ['Peas', 26, ['pea', 'green peas']], ['Celery', 22], ['Green beans', 20, ['green bean', 'string beans', 'beans']], ['Cauliflower', 18], ['Pepper', 16, ['bell pepper', 'peppers', 'green pepper']], ['Cabbage', 14], ['Asparagus', 12], ['Sweet potato', 10, ['yam', 'yams']], ['Zucchini', 10, ['courgette']], ['Kale', 9], ['Brussels sprouts', 9, ['brussel sprouts', 'sprouts']], ['Mushroom', 8, ['mushrooms']], ['Squash', 8], ['Eggplant', 7, ['aubergine']], ['Beet', 7, ['beets', 'beetroot']], ['Radish', 6], ['Pumpkin', 6], ['Garlic', 5], ['Artichoke', 4], ['Turnip', 4], ['Okra', 4], ['Leek', 3, ['leeks']], ['Parsnip', 3], ['Collard greens', 3, ['collards']], ['Arugula', 2, ['rocket']], ['Bok choy', 2], ['Chard', 2, ['swiss chard']], ['Rutabaga', 2], ['Fennel', 2], ['Scallion', 2, ['scallions', 'green onion', 'spring onion']], ['Shallot', 2], ['Endive', 2], ['Kohlrabi', 2], ['Watercress', 2], ['Jicama', 2], ['Edamame', 2], ['Rhubarb', 2], ['Radicchio', 2], ['Yuca', 2, ['cassava']], ['Ginger', 2]],
      no: [['Apple', 'An apple is a fruit.'], ['Banana', 'A banana is a fruit.'], ['Strawberry', 'A strawberry is a fruit.'], ['Rice', 'Rice is a grain.'], ['Bread', 'Bread is not a vegetable.'], ['Chicken', 'Chicken is not a vegetable.'], ['Vegetable', 'Name one!']] },
    { q: 'Name a breed of dog.',
      a: [['Labrador', 60, ['lab', 'labrador retriever']], ['Golden Retriever', 55, ['golden']], ['German Shepherd', 55], ['Poodle', 45], ['Bulldog', 40, ['english bulldog']], ['Chihuahua', 38], ['Beagle', 30], ['Pug', 28], ['Husky', 28, ['siberian husky']], ['Dachshund', 25, ['wiener dog', 'sausage dog']], ['Rottweiler', 22], ['Pit Bull', 22, ['pit bull terrier']], ['Boxer', 18], ['Great Dane', 18], ['Yorkie', 16, ['yorkshire terrier']], ['Corgi', 16, ['welsh corgi']], ['Dalmatian', 16], ['Doberman', 14, ['doberman pinscher']], ['Shih Tzu', 12], ['French Bulldog', 12, ['frenchie']], ['Border Collie', 10, ['collie']], ['Cocker Spaniel', 9, ['spaniel']], ['Pomeranian', 9], ['Saint Bernard', 8], ['Greyhound', 7], ['Terrier', 6], ['Maltese', 6], ['Boston Terrier', 6], ['Australian Shepherd', 6, ['aussie']], ['Schnauzer', 5], ['Basset Hound', 5], ['Goldendoodle', 5], ['Labradoodle', 4], ['Bloodhound', 4], ['Mastiff', 4], ['Shiba Inu', 4, ['shiba']], ['Jack Russell', 4, ['jack russell terrier']], ['Akita', 3], ['Bichon Frise', 3, ['bichon']], ['Newfoundland', 3], ['Bernese Mountain Dog', 3, ['bernese']], ['Sheepdog', 3, ['old english sheepdog']], ['Chow Chow', 3, ['chow']], ['Weimaraner', 2], ['Samoyed', 2], ['Whippet', 2], ['Malamute', 2, ['alaskan malamute']], ['Havanese', 2], ['Cavalier King Charles Spaniel', 2, ['cavalier', 'king charles spaniel']], ['Irish Setter', 2, ['setter']], ['Pointer', 2], ['Shar Pei', 2], ['Great Pyrenees', 2], ['Vizsla', 2], ['Rhodesian Ridgeback', 2, ['ridgeback']], ['Papillon', 2], ['Pekingese', 2], ['Lhasa Apso', 2], ['Westie', 2, ['west highland terrier', 'west highland white terrier']], ['Scottish Terrier', 2, ['scottie']], ['Cockapoo', 2], ['Bull Terrier', 2], ['Airedale', 2], ['Basenji', 2], ['Afghan Hound', 2], ['Wolfhound', 2, ['irish wolfhound']], ['Belgian Malinois', 2, ['malinois']], ['Cane Corso', 2], ['Saluki', 2], ['Borzoi', 2]],
      no: [['Mutt', 'A mutt is a mix, not a breed.'], ['Puppy', 'A puppy is a young dog, not a breed.'], ['Wolf', 'A wolf is not a dog breed.'], ['Siamese', 'Siamese is a cat breed.'], ['Tabby', 'A tabby is a cat.'], ['Coyote', 'A coyote is not a dog breed.'], ['Fox', 'A fox is not a dog breed.'], ['Dog', 'Name a breed!']] },
    { q: 'Name a car brand.',
      a: [['Toyota', 60], ['Ford', 60], ['Honda', 50], ['Tesla', 45], ['BMW', 40], ['Chevrolet', 38, ['chevy']], ['Mercedes', 36, ['mercedes benz', 'benz']], ['Ferrari', 30], ['Nissan', 25], ['Jeep', 24], ['Audi', 22], ['Volkswagen', 20, ['vw']], ['Porsche', 20], ['Lamborghini', 18], ['Hyundai', 16], ['Kia', 15], ['Subaru', 14], ['Lexus', 12], ['Dodge', 12], ['Mazda', 10], ['Cadillac', 9], ['Volvo', 9], ['GMC', 8], ['Buick', 6], ['Jaguar', 6], ['Land Rover', 5, ['range rover']], ['Mini', 5, ['mini cooper']], ['Chrysler', 5], ['Ram', 5], ['Lincoln', 4], ['Acura', 4], ['Infiniti', 4], ['Bentley', 4], ['Rolls Royce', 4], ['Fiat', 4], ['Mitsubishi', 3], ['Maserati', 3], ['Aston Martin', 3], ['Bugatti', 3], ['McLaren', 3], ['Alfa Romeo', 2], ['Peugeot', 2], ['Renault', 2], ['Suzuki', 2], ['Genesis', 2], ['Rivian', 2], ['Lucid', 2], ['Polestar', 2], ['Pontiac', 2], ['Saturn', 2], ['Oldsmobile', 2], ['Hummer', 2], ['Saab', 2], ['Lotus', 2], ['Citroen', 2], ['Skoda', 2], ['Mercury', 2], ['Plymouth', 2], ['Studebaker', 2], ['DeLorean', 2], ['BYD', 2], ['Smart', 2], ['Scion', 2], ['Isuzu', 2], ['Opel', 2], ['Vauxhall', 2], ['Koenigsegg', 2], ['Pagani', 2], ['Datsun', 2], ['Packard', 2]],
      no: [['Mustang', 'The Mustang is a Ford model, not a brand.'], ['Corvette', 'The Corvette is a Chevrolet model.'], ['Camry', 'The Camry is a Toyota model.'], ['Civic', 'The Civic is a Honda model.'], ['Prius', 'The Prius is a Toyota model.'], ['Harley', 'Harley-Davidson makes motorcycles.'], ['Uber', 'Uber is a ride service.'], ['Beetle', 'The Beetle is a Volkswagen model.'], ['Tacoma', 'The Tacoma is a Toyota model.'], ['Car', 'Name a brand!']] }
  ],

  /* the catalog of games, in the order a show plays them */
  rounds: [
    { key: 'vote', title: 'Everybody Votes', how: ['Everyone answers on their own phone.', 'Your team scores the share of teammates who get it right.', 'Fastest correct answer earns a bonus.'] },
    { key: 'likely', title: 'Most Likely To', how: ['No trivia. Vote for the person in this room who fits best.', 'You score when you vote with the biggest group.', 'Yes, you can vote for yourself.'] },
    { key: 'board', title: 'The Board', how: ['One player picks a category and a point value.', 'Then everyone answers on their own phone. Take your time, you have 20 seconds.', 'Every right answer scores. The fastest right answer earns a bonus.'] },
    { key: 'tf', title: 'True or False Blitz', how: ['A statement appears. True or false?', 'Everyone answers. You have 12 seconds.', 'Your team scores the share of teammates who get it right.'] },
    { key: 'zoom', title: 'Zoom In', how: ['A famous place slowly comes into view.', 'Buzz early for more points.', 'A wrong guess locks your team out.'] },
    { key: 'num', title: 'Closest Call', how: ['Every answer is a number.', 'Everyone types a guess.', 'The closest guess wins 150 points for the team.'] },
    { key: 'phrase', title: 'Phrase Fever', how: ['Take turns picking letters.', 'Anyone can hit SOLVE and type the phrase.', 'Five misses and the puzzle is lost.'] },
    { key: 'decade', title: 'Name That Decade', how: ['Something happened. In which decade?', 'Everyone answers on their own phone.', 'Grandparents, this one is yours.'] },
    { key: 'scramble', title: 'Word Scramble', how: ['The letters are mixed up. Type the word.', 'First to solve wins 150. Everyone else can still score 40.', 'Wrong tries cost nothing. Close spelling counts.'] },
    { key: 'crillion', title: 'Crillion', how: ['Everyone types one answer to the same question.', 'Rare answers score more. If someone else in the room types the same thing, you split the points.', 'A wrong answer scores zero. Close spelling counts.'] },
    { key: 'feud', title: 'Survey Says', how: ['We asked 1,000 imaginary people. Find their top 5 answers.', 'Three strikes and the other team can steal.', 'The last survey is worth double.'] }
  ],
  order: ['vote', 'likely', 'board', 'tf', 'zoom', 'num', 'phrase', 'decade', 'scramble', 'crillion', 'feud'],
  /* Set this to a private judge address to let an AI model rule on Crillion answers that are not on the sheet. */
  judgeUrl: '',

  lines: {
    welcome: ['Welcome to Rain Check, the only game show that needs bad weather. I am your host, Drizzle McCloud.'],
    right: ['Correct!', 'Yes! Nailed it.', 'That is right!', 'Boom. Correct.', 'You got it!'],
    wrong: ['Ooh, no.', 'Not this time.', 'Sorry, that is wrong.', 'Nope!'],
    steal: ['Chance to steal!', 'The other team can steal it!'],
    nobuzz: ['Nobody? Really?', 'Time is up.'],
    strike: ['Strike!', 'Not on the board!'],
    survey: ['Survey says...', 'Show me the answer!'],
    final: ['What a game! Thanks for playing Rain Check.']
  }
};
if (typeof module !== 'undefined') { module.exports = RC; }

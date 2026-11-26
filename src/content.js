/* Rain Check! game content. In every question the FIRST option is the correct one;
   the engine shuffles options before they are shown. */
var RC = (typeof RC !== 'undefined') ? RC : {};
RC.content = {
  votes: [
    { q: 'Which animal is the tallest in the world?', o: ['Giraffe', 'Elephant', 'Ostrich', 'Camel'], f: 'A giraffe can be 18 feet tall.' },
    { q: 'How many days are in a leap year?', o: ['366', '365', '364', '360'], f: 'The extra day is February 29.' },
    { q: 'Which planet is famous for its rings?', o: ['Saturn', 'Mars', 'Venus', 'Mercury'], f: 'The rings are mostly ice.' },
    { q: 'What is the main ingredient in guacamole?', o: ['Avocado', 'Lime', 'Green pepper', 'Cucumber'], f: '' },
    { q: 'Which instrument has 88 keys?', o: ['Piano', 'Accordion', 'Organ', 'Harp'], f: '52 white keys and 36 black keys.' },
    { q: 'In which country were the Olympic Games born?', o: ['Greece', 'Italy', 'France', 'Egypt'], f: 'The ancient games were held at Olympia.' },
    { q: 'Which ship sank in 1912 after hitting an iceberg?', o: ['Titanic', 'Lusitania', 'Mayflower', 'Queen Mary'], f: '' },
    { q: 'How many states are in the United States?', o: ['50', '48', '51', '52'], f: 'Alaska and Hawaii joined in 1959.' },
    { q: 'Which is the only mammal that can truly fly?', o: ['Bat', 'Flying squirrel', 'Penguin', 'Ostrich'], f: 'Flying squirrels only glide.' },
    { q: 'How many continents are there?', o: ['7', '5', '6', '8'], f: '' },
    { q: 'Who painted the Mona Lisa?', o: ['Leonardo da Vinci', 'Michelangelo', 'Picasso', 'Van Gogh'], f: 'It hangs in the Louvre in Paris.' },
    { q: 'Which ocean lies between America and Europe?', o: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], f: '' },
    { q: 'At what temperature does water freeze, in Fahrenheit?', o: ['32', '0', '100', '212'], f: 'That is 0 degrees Celsius.' },
    { q: 'What does "WWW" stand for at the start of a web address?', o: ['World Wide Web', 'World Web Window', 'Wide Wire Web', 'Web Wide World'], f: '' },
    { q: 'On old telephones, what did you spin to call a number?', o: ['A rotary dial', 'A crank handle', 'A tuning knob', 'A key'], f: 'Ask a grandparent to show the move.' },
    { q: 'How many strings does a standard guitar have?', o: ['6', '4', '5', '8'], f: '' },
    { q: 'Which bird cannot fly but is a champion swimmer?', o: ['Penguin', 'Pelican', 'Seagull', 'Duck'], f: '' },
    { q: 'Which is the largest country in the world by area?', o: ['Russia', 'Canada', 'China', 'United States'], f: '' },
    { q: 'What do you call a baby kangaroo?', o: ['Joey', 'Cub', 'Kit', 'Pup'], f: '' },
    { q: 'Before streaming, which store did families visit to rent a movie on Friday night?', o: ['Blockbuster', 'RadioShack', 'Woolworth', 'Sears'], f: 'Be kind, rewind.' }
  ],

  board: [
    { name: 'Geography', levels: [
      [ { q: 'What is the capital of France?', o: ['Paris', 'Lyon', 'Nice', 'Brussels'] },
        { q: 'Which is the largest ocean on Earth?', o: ['Pacific', 'Atlantic', 'Indian', 'Arctic'] } ],
      [ { q: 'Which country is shaped like a boot?', o: ['Italy', 'Spain', 'Greece', 'Portugal'] },
        { q: 'What is the longest river in South America?', o: ['Amazon', 'Orinoco', 'Paraná', 'Magdalena'] } ],
      [ { q: 'What is the capital of Australia?', o: ['Canberra', 'Sydney', 'Melbourne', 'Perth'] },
        { q: 'Which country has the most people today?', o: ['India', 'China', 'United States', 'Indonesia'] } ],
      [ { q: 'Mount Kilimanjaro is in which country?', o: ['Tanzania', 'Kenya', 'Ethiopia', 'South Africa'] },
        { q: 'Which African country was once called Abyssinia?', o: ['Ethiopia', 'Ghana', 'Morocco', 'Zimbabwe'] } ]
    ] },
    { name: 'Sports', levels: [
      [ { q: 'How many players does one soccer team have on the field?', o: ['11', '9', '10', '12'] },
        { q: 'In which sport do you hit a shuttlecock?', o: ['Badminton', 'Tennis', 'Squash', 'Cricket'] } ],
      [ { q: 'How many rings are on the Olympic flag?', o: ['5', '4', '6', '7'] },
        { q: 'Which sport is played at Wimbledon?', o: ['Tennis', 'Golf', 'Cricket', 'Polo'] } ],
      [ { q: 'What is a perfect score in ten-pin bowling?', o: ['300', '200', '250', '100'] },
        { q: 'Which country gave the world judo?', o: ['Japan', 'China', 'Korea', 'Thailand'] } ],
      [ { q: 'About how many miles long is a marathon?', o: ['26.2', '13.1', '20', '31'] },
        { q: 'Which country has won the most men\'s soccer World Cups?', o: ['Brazil', 'Germany', 'Italy', 'Argentina'] } ]
    ] },
    { name: 'Health & Body', levels: [
      [ { q: 'Which organ pumps blood around your body?', o: ['Heart', 'Lungs', 'Liver', 'Stomach'] },
        { q: 'What do you call a doctor who takes care of teeth?', o: ['Dentist', 'Optician', 'Podiatrist', 'Vet'] } ],
      [ { q: 'Which vitamin does your skin make from sunlight?', o: ['Vitamin D', 'Vitamin C', 'Vitamin A', 'Vitamin K'] },
        { q: 'What is the largest organ of the human body?', o: ['Skin', 'Liver', 'Brain', 'Lungs'] } ],
      [ { q: 'How many bones does an adult human have?', o: ['206', '106', '306', '186'] },
        { q: 'Which blood type is called the universal donor?', o: ['O negative', 'AB positive', 'A positive', 'B negative'] } ],
      [ { q: 'Where in the body is the smallest bone?', o: ['The ear', 'The little toe', 'The nose', 'The wrist'] },
        { q: 'Which part of the eye gives it its color?', o: ['Iris', 'Pupil', 'Cornea', 'Retina'] } ]
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
      [ { q: 'Who was known as the King of Rock and Roll?', o: ['Elvis Presley', 'Chuck Berry', 'Buddy Holly', 'Frank Sinatra'] },
        { q: 'Which band had John, Paul, George and Ringo?', o: ['The Beatles', 'The Rolling Stones', 'The Beach Boys', 'The Monkees'] } ],
      [ { q: 'In what year did people first walk on the Moon?', o: ['1969', '1959', '1965', '1972'] },
        { q: 'Who was the first person to walk on the Moon?', o: ['Neil Armstrong', 'Buzz Aldrin', 'John Glenn', 'Yuri Gagarin'] } ],
      [ { q: 'Which TV show starred Lucy and Ricky Ricardo?', o: ['I Love Lucy', 'The Honeymooners', 'Bewitched', 'Happy Days'] },
        { q: 'Which colorful cube puzzle became a worldwide craze in 1980?', o: ['Rubik\'s Cube', 'Simon', 'Tetris', 'Jenga'] } ],
      [ { q: 'Which 1969 music festival drew about 400,000 people to a farm in New York?', o: ['Woodstock', 'Monterey Pop', 'Newport', 'Live Aid'] },
        { q: 'What was the first music video played on MTV in 1981?', o: ['Video Killed the Radio Star', 'Thriller', 'Take On Me', 'Billie Jean'] } ]
    ] },
    { name: 'Kid Zone', levels: [
      [ { q: 'What color do you get when you mix blue and yellow?', o: ['Green', 'Purple', 'Orange', 'Brown'] },
        { q: 'In Minecraft, which green creature sneaks up and explodes?', o: ['Creeper', 'Zombie', 'Enderman', 'Skeleton'] } ],
      [ { q: 'How many legs does a spider have?', o: ['8', '6', '10', '12'] },
        { q: 'Which planet is called the Red Planet?', o: ['Mars', 'Jupiter', 'Venus', 'Saturn'] } ],
      [ { q: 'What is the fastest land animal?', o: ['Cheetah', 'Lion', 'Horse', 'Greyhound'] },
        { q: 'Which is the largest planet in our solar system?', o: ['Jupiter', 'Saturn', 'Neptune', 'Earth'] } ],
      [ { q: 'What gas do plants take in from the air?', o: ['Carbon dioxide', 'Oxygen', 'Helium', 'Hydrogen'] },
        { q: 'What is the hardest natural substance on Earth?', o: ['Diamond', 'Gold', 'Granite', 'Iron'] } ]
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
    { t: 'RAINING CATS AND DOGS', h: 'Weather talk' },
    { t: 'A PIECE OF CAKE', h: 'Easy does it' },
    { t: 'BETTER LATE THAN NEVER', h: 'Good advice' },
    { t: 'HOME SWEET HOME', h: 'On the doormat' },
    { t: 'THE EARLY BIRD GETS THE WORM', h: 'Good advice' },
    { t: 'SAVE IT FOR A RAINY DAY', h: 'Weather talk' },
    { t: 'ONCE IN A BLUE MOON', h: 'How often?' },
    { t: 'BREAK A LEG', h: 'Said backstage' },
    { t: 'EVERY CLOUD HAS A SILVER LINING', h: 'Look on the bright side' },
    { t: 'FAMILY GAME NIGHT', h: 'Right now' },
    { t: 'LAUGHTER IS THE BEST MEDICINE', h: 'Good advice' },
    { t: 'TWO PEAS IN A POD', h: 'Best friends' }
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
    { q: 'A group of lions is called a pride.', a: true, f: '' },
    { q: 'You can see the Great Wall of China from the Moon with your bare eyes.', a: false, f: 'It is far too narrow to see from that far away.' },
    { q: 'An octopus has three hearts.', a: true, f: 'Two pump blood to the gills, one to the body.' },
    { q: 'Lightning never strikes the same place twice.', a: false, f: 'Tall buildings get hit many times a year.' },
    { q: 'Venus is the hottest planet in our solar system.', a: true, f: 'Hotter than Mercury, thanks to its thick air.' },
    { q: 'Sharks are mammals.', a: false, f: 'Sharks are fish.' },
    { q: 'The Atlantic is the largest ocean on Earth.', a: false, f: 'The Pacific is the largest.' },
    { q: 'Mount Everest is the highest mountain above sea level.', a: true, f: '' },
    { q: 'Goldfish only remember things for three seconds.', a: false, f: 'They can remember for months.' },
    { q: 'The Statue of Liberty was a gift from France.', a: true, f: 'It arrived in 1885.' },
    { q: 'Adults have more bones than babies.', a: false, f: 'Babies have about 300. Many fuse as we grow.' },
    { q: 'Australia is both a country and a continent.', a: true, f: '' },
    { q: 'Spiders are insects.', a: false, f: 'Spiders are arachnids, with eight legs.' },
    { q: 'The Eiffel Tower is in Rome.', a: false, f: 'It is in Paris.' },
    { q: 'Sound travels faster in water than in air.', a: true, f: 'More than four times faster.' },
    { q: 'Honey can last for thousands of years without spoiling.', a: true, f: '' }
  ],

  decades: [
    { q: 'People first walked on the Moon.', o: ['1960s', '1950s', '1970s', '1980s'] },
    { q: 'The Berlin Wall came down.', o: ['1980s', '1960s', '1970s', '1990s'] },
    { q: 'The first iPhone went on sale.', o: ['2000s', '1990s', '2010s', '1980s'] },
    { q: 'Elvis Presley released "Heartbreak Hotel".', o: ['1950s', '1940s', '1960s', '1970s'] },
    { q: 'The Beatles first played The Ed Sullivan Show.', o: ['1960s', '1950s', '1970s', '1980s'] },
    { q: 'The first Star Wars movie opened in theaters.', o: ['1970s', '1960s', '1980s', '1990s'] },
    { q: 'The movie Titanic opened in theaters.', o: ['1990s', '1980s', '2000s', '2010s'] },
    { q: 'Disney released Frozen.', o: ['2010s', '1990s', '2000s', '2020s'] },
    { q: 'World War II ended.', o: ['1940s', '1930s', '1950s', '1960s'] },
    { q: 'MTV went on the air.', o: ['1980s', '1960s', '1970s', '1990s'] },
    { q: 'YouTube was launched.', o: ['2000s', '1990s', '2010s', '1980s'] },
    { q: 'Pac-Man arrived in arcades.', o: ['1980s', '1960s', '1970s', '1990s'] },
    { q: 'Disneyland opened in California.', o: ['1950s', '1940s', '1960s', '1970s'] },
    { q: 'The first Harry Potter book was published.', o: ['1990s', '1980s', '2000s', '2010s'] }
  ],

  likely: [
    'fall asleep during a movie', 'win a dance contest', 'get lost even with the GPS on', 'eat dessert before dinner',
    'start talking to a stranger in line', 'forget where the car is parked', 'become famous one day', 'survive on a desert island',
    'sing loudly in the shower', 'laugh at the wrong moment', 'burn the toast', 'be the last one ready to leave',
    'cry at a commercial', 'win this game', 'tell the same story twice', 'pack three suitcases for a weekend'
  ],

  numbers: [
    { q: 'How many keys does a piano have?', a: 88 },
    { q: 'How many feet are in a mile?', a: 5280 },
    { q: 'How many minutes are in one day?', a: 1440 },
    { q: 'In what year did the Titanic sink?', a: 1912, y: true },
    { q: 'How many squares are on a chessboard?', a: 64 },
    { q: 'How many dots are on a pair of dice?', a: 42 },
    { q: 'At what temperature does water boil, in Fahrenheit?', a: 212 },
    { q: 'How many hearts does an octopus have?', a: 3 },
    { q: 'In what year did the first iPhone go on sale?', a: 2007, y: true },
    { q: 'How many cards are in a standard deck, without the jokers?', a: 52 },
    { q: 'How many stripes are on the American flag?', a: 13 },
    { q: 'How tall is Mount Everest, in feet?', a: 29032 },
    { q: 'How many teeth does an adult usually have?', a: 32 },
    { q: 'How many legs does a lobster have?', a: 10 },
    { q: 'How many players does a baseball team put on the field?', a: 9 },
    { q: 'In what year did people first walk on the Moon?', a: 1969, y: true }
  ],

  words: [
    { w: 'UMBRELLA', h: 'Rainy day gear' }, { w: 'THUNDER', h: 'Storm sound' }, { w: 'RAINBOW', h: 'After the rain' },
    { w: 'PUDDLE', h: 'Splash' }, { w: 'PANCAKE', h: 'Breakfast' }, { w: 'POPCORN', h: 'Movie snack' },
    { w: 'BLANKET', h: 'Cozy' }, { w: 'VACATION', h: 'Family time' }, { w: 'SUITCASE', h: 'Travel' },
    { w: 'COUSIN', h: 'Family' }, { w: 'DINOSAUR', h: 'Long ago' }, { w: 'SANDWICH', h: 'Lunch' },
    { w: 'PILLOW', h: 'Bedtime' }, { w: 'GUITAR', h: 'Music' }, { w: 'ELEPHANT', h: 'Animal' }, { w: 'HOLIDAY', h: 'Time off' }
  ],

  /* Crillion. Each answer: [name, how many people out of 100 would say it, other spellings].
     The counts are the show's own estimates, not a real survey. "no" lists common wrong answers and why. */
  crillion: [
    { q: 'Name a country in South America.', a: [['Brazil', 88], ['Argentina', 74], ['Peru', 52], ['Colombia', 49, ['columbia']], ['Chile', 45], ['Venezuela', 38], ['Ecuador', 27], ['Bolivia', 22], ['Uruguay', 18], ['Paraguay', 14], ['Guyana', 6], ['Suriname', 3, ['surinam']]],
      no: [['Mexico', 'Mexico is in North America.'], ['Panama', 'Panama is in Central America.'], ['French Guiana', 'French Guiana is part of France, not a country.'], ['Costa Rica', 'Costa Rica is in Central America.'], ['Cuba', 'Cuba is in the Caribbean.'], ['Spain', 'Spain is in Europe.'], ['Guatemala', 'Guatemala is in Central America.'], ['Honduras', 'Honduras is in Central America.']] },
    { q: 'Name a planet in our solar system.', a: [['Earth', 80], ['Mars', 78], ['Jupiter', 62], ['Saturn', 60], ['Venus', 41], ['Mercury', 33], ['Neptune', 24], ['Uranus', 21]],
      no: [['Pluto', 'Pluto has been a dwarf planet since 2006.'], ['Sun', 'The Sun is a star.'], ['Moon', 'The Moon is a moon.'], ['Ceres', 'Ceres is a dwarf planet.']] },
    { q: 'Name one of the seven dwarfs in Snow White.', a: [['Dopey', 71], ['Grumpy', 68], ['Sleepy', 55], ['Happy', 47], ['Sneezy', 39], ['Doc', 30], ['Bashful', 17]],
      no: [['Lazy', 'There is no Lazy.'], ['Smiley', 'There is no Smiley.'], ['Sleazy', 'Not one of the seven.'], ['Snoozy', 'You may be thinking of Sleepy.']] },
    { q: 'Name a U.S. state that starts with the letter M.', a: [['Michigan', 58], ['Massachusetts', 51], ['Maine', 44], ['Mississippi', 43], ['Minnesota', 37], ['Montana', 34], ['Maryland', 31], ['Missouri', 25]],
      no: [['Miami', 'Miami is a city.'], ['Memphis', 'Memphis is a city.'], ['Mexico', 'Mexico is a country. New Mexico starts with N.'], ['Manhattan', 'Manhattan is part of New York City.'], ['Milwaukee', 'Milwaukee is a city.']] },
    { q: 'Name a color of the rainbow.', a: [['Red', 85], ['Blue', 74], ['Yellow', 63], ['Green', 60], ['Orange', 48], ['Violet', 22, ['purple']], ['Indigo', 15]],
      no: [['Pink', 'Pink is not in the rainbow.'], ['White', 'White is all the colors together.'], ['Black', 'Black is not in the rainbow.'], ['Brown', 'Brown is not in the rainbow.'], ['Gold', 'That is at the end of it.']] },
    { q: 'Name one of the five Great Lakes.', a: [['Superior', 62], ['Michigan', 60], ['Erie', 47, ['eerie']], ['Huron', 33], ['Ontario', 29]],
      no: [['Tahoe', 'Lake Tahoe is in California and Nevada.'], ['Champlain', 'Lake Champlain is not one of the five.'], ['Okeechobee', 'Lake Okeechobee is in Florida.'], ['Salt Lake', 'The Great Salt Lake is in Utah.']] },
    { q: 'Name a chess piece.', a: [['Queen', 76], ['King', 70], ['Pawn', 62], ['Knight', 50, ['horse']], ['Bishop', 34], ['Rook', 31, ['castle', 'tower']]],
      no: [['Jack', 'That is a playing card.'], ['Ace', 'That is a playing card.'], ['Checker', 'That is a different game.'], ['Joker', 'That is a playing card.']] },
    { q: 'Name a continent.', a: [['Europe', 68], ['Africa', 66], ['Asia', 60], ['North America', 58], ['South America', 49], ['Australia', 41, ['oceania', 'australasia']], ['Antarctica', 27, ['antartica']]],
      no: [['America', 'Say North America or South America.'], ['Arctic', 'The Arctic is an ocean, not a continent.'], ['Greenland', 'Greenland is an island.'], ['India', 'India is a country.'], ['Central America', 'Central America is part of North America.']] },
    { q: 'Name a month that has exactly 30 days.', a: [['September', 52], ['June', 47], ['April', 44], ['November', 38]],
      no: [['February', 'February has 28 or 29 days.'], ['January', 'January has 31 days.'], ['March', 'March has 31 days.'], ['May', 'May has 31 days.'], ['July', 'July has 31 days.'], ['August', 'August has 31 days.'], ['October', 'October has 31 days.'], ['December', 'December has 31 days.']] },
    { q: 'Name one of the four Beatles.', a: [['John Lennon', 82, ['john', 'lennon']], ['Paul McCartney', 79, ['paul', 'mccartney']], ['Ringo Starr', 58, ['ringo', 'starr']], ['George Harrison', 37, ['george', 'harrison']]],
      no: [['Mick Jagger', 'Mick Jagger is a Rolling Stone.'], ['Elvis', 'Elvis was never a Beatle.'], ['Pete Best', 'Pete Best left before they were famous.'], ['Yoko Ono', 'Yoko Ono was never in the band.']] },
    { q: 'Name a sign of the zodiac.', a: [['Leo', 52], ['Scorpio', 44], ['Gemini', 41], ['Cancer', 39], ['Aries', 38], ['Taurus', 36], ['Pisces', 35], ['Libra', 34], ['Virgo', 33], ['Aquarius', 31], ['Sagittarius', 28, ['sagitarius']], ['Capricorn', 27]],
      no: [['Dragon', 'The dragon is in the Chinese zodiac.'], ['Orion', 'Orion is a constellation, not a zodiac sign.'], ['Tiger', 'The tiger is in the Chinese zodiac.']] },
    { q: 'Name one of the world\'s oceans.', a: [['Pacific', 84], ['Atlantic', 80], ['Indian', 46], ['Arctic', 38], ['Southern', 9, ['antarctic']]],
      no: [['Mediterranean', 'The Mediterranean is a sea.'], ['Caribbean', 'The Caribbean is a sea.'], ['Dead Sea', 'The Dead Sea is a lake.'], ['Gulf of Mexico', 'That is a gulf.']] },
    { q: 'Name a country in Central America.', a: [['Costa Rica', 55], ['Panama', 52], ['Guatemala', 38], ['Honduras', 33], ['Nicaragua', 30], ['El Salvador', 27, ['salvador']], ['Belize', 16]],
      no: [['Mexico', 'Mexico is in North America.'], ['Cuba', 'Cuba is in the Caribbean.'], ['Colombia', 'Colombia is in South America.'], ['Puerto Rico', 'Puerto Rico is a U.S. territory in the Caribbean.'], ['Venezuela', 'Venezuela is in South America.']] },
    { q: 'Name an instrument you would see in an orchestra.', a: [['Violin', 81], ['Trumpet', 52], ['Flute', 50], ['Cello', 44], ['Clarinet', 33], ['Trombone', 27], ['Tuba', 22], ['Harp', 20], ['Oboe', 14], ['Viola', 12], ['French horn', 12, ['horn']], ['Double bass', 10, ['bass', 'contrabass']], ['Timpani', 7, ['kettledrum', 'kettle drums']], ['Bassoon', 6], ['Xylophone', 6], ['Piccolo', 5], ['Cymbals', 4, ['cymbal']], ['Triangle', 4], ['Piano', 30], ['Drums', 28, ['drum', 'snare drum', 'bass drum']]],
      no: [['Kazoo', 'Not in a standard orchestra.'], ['Banjo', 'Not in a standard orchestra.'], ['Ukulele', 'Not in a standard orchestra.']] }
  ],

  /* the catalog of games, in the order a show plays them */
  rounds: [
    { key: 'vote', title: 'Everybody Votes', how: ['Everyone answers on their own phone.', 'Your team scores the share of teammates who get it right.', 'Fastest correct answer earns a bonus.'] },
    { key: 'likely', title: 'Most Likely To', how: ['No trivia. Vote for the person in this room who fits best.', 'You score when you vote with the biggest group.', 'Yes, you can vote for yourself.'] },
    { key: 'board', title: 'The Board', how: ['Pick a category and a point value.', 'Buzz in first, then answer on your phone.', 'Miss it and the other team can steal.'] },
    { key: 'tf', title: 'True or False Blitz', how: ['A statement appears. True or false?', 'Everyone answers. You have 12 seconds.', 'Your team scores the share of teammates who get it right.'] },
    { key: 'zoom', title: 'Zoom In', how: ['A famous place slowly comes into view.', 'Buzz early for more points.', 'A wrong guess locks your team out.'] },
    { key: 'num', title: 'Closest Call', how: ['Every answer is a number.', 'Everyone types a guess.', 'The closest guess wins 150 points for the team.'] },
    { key: 'phrase', title: 'Phrase Fever', how: ['Take turns picking letters.', 'Anyone can hit SOLVE and type the phrase.', 'Five misses and the puzzle is lost.'] },
    { key: 'decade', title: 'Name That Decade', how: ['Something happened. In which decade?', 'Everyone answers on their own phone.', 'Grandparents, this one is yours.'] },
    { key: 'scramble', title: 'Word Scramble', how: ['The letters are mixed up. Type the word.', 'First to solve wins 150. Everyone else can still score 40.', 'Wrong tries cost nothing.'] },
    { key: 'crillion', title: 'Crillion', how: ['Everyone types one answer to the same question.', 'The fewer people who would think of it, the more it scores.', 'A wrong answer scores zero.'] },
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

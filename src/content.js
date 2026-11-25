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

  surveys: [
    { q: 'Name something a burglar would NOT want to find in your house.', o: ['A big dog', 'An alarm system', 'Security cameras', 'The owner wide awake', 'A police officer', 'A light-sleeping grandma', 'Booby traps', 'A talking parrot', 'Nosy neighbors', 'A karate trophy shelf'] },
    { q: 'What is the funniest thing that can happen at a family dinner?', o: ['Someone burps loudly', 'Grandpa falls asleep', 'Someone spills a drink', 'The dog steals food', 'A kid says something embarrassing', 'Milk comes out of a nose', 'The main dish hits the floor', 'A chair breaks', 'The same old story, again', 'A silly ringtone goes off'] },
    { q: 'What do people always forget to pack for a trip?', o: ['Toothbrush', 'Phone charger', 'Socks', 'Underwear', 'Sunscreen', 'Pajamas', 'Umbrella', 'Medicine', 'Swimsuit', 'Deodorant'] },
    { q: 'What is the best thing to do on a rainy day?', o: ['Watch a movie', 'Play board games', 'Take a nap', 'Read a book', 'Bake cookies', 'Play video games', 'Do a puzzle', 'Splash in puddles', 'Build a pillow fort', 'Drink hot chocolate'] },
    { q: 'Name an excuse kids give for not doing homework.', o: ['The dog ate it', 'I forgot', 'I left it at school', 'I did not understand it', 'The Wi-Fi was down', 'I was sick', 'I already did it', 'We had no homework', 'My brother ruined it', 'I was too tired'] },
    { q: 'What does every grandparent have in their house?', o: ['A candy dish', 'Family photos', 'A comfy recliner', 'Old photo albums', 'A loud ticking clock', 'Cookies', 'A remote nobody else can work', 'Reading glasses everywhere', 'A very loud TV', 'Little statues on a shelf'] }
  ],

  rounds: [
    { key: 'vote', title: 'Everybody Votes', how: ['Everyone answers on their own phone.', 'Your team scores the share of teammates who get it right.', 'Fastest correct answer earns a bonus.'] },
    { key: 'board', title: 'The Board', how: ['Pick a category and a point value.', 'Buzz in first, then answer on your phone.', 'Miss it and the other team can steal.'] },
    { key: 'zoom', title: 'Zoom In', how: ['A famous place slowly comes into view.', 'Buzz early for more points.', 'A wrong guess locks your team out.'] },
    { key: 'phrase', title: 'Phrase Fever', how: ['Take turns picking letters.', 'Anyone can hit SOLVE and type the phrase.', 'Five misses and the puzzle is lost.'] },
    { key: 'feud', title: 'Survey Says', how: ['The board comes from this family\'s own answers.', 'Find the top 5. Three strikes and the other team can steal.', 'The last survey is worth double.'] }
  ],

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

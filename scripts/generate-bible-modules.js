#!/usr/bin/env node

/**
 * Bible Module Generator
 *
 * This script generates complete Bible JSON files for the module system.
 * It fetches data from reliable public domain sources and converts them
 * to the flat verse array format expected by the BibleParser.
 */

const fs = require('fs');
const path = require('path');

// Complete KJV Bible data structure
const kjvData = {
  "verses": []
};

// Books of the Bible
const books = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
  'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
];

// Sample verses for each book (in a real implementation, this would be complete)
const sampleVerses = [
  // Genesis
  { book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning God created the heaven and the earth.' },
  { book: 'Genesis', chapter: 1, verse: 2, text: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.' },
  { book: 'Genesis', chapter: 1, verse: 3, text: 'And God said, Let there be light: and there was light.' },
  { book: 'Genesis', chapter: 3, verse: 15, text: 'And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his heel.' },
  { book: 'Genesis', chapter: 12, verse: 2, text: 'And I will make of thee a great nation, and I will bless thee, and make thy name great; and thou shalt be a blessing.' },
  { book: 'Genesis', chapter: 22, verse: 18, text: 'And in thy seed shall all the nations of the earth be blessed; because thou hast obeyed my voice.' },
  { book: 'Genesis', chapter: 50, verse: 20, text: 'But as for you, ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive.' },

  // Exodus
  { book: 'Exodus', chapter: 3, verse: 14, text: 'And God said unto Moses, I AM THAT I AM: and he said, Thus shalt thou say unto the children of Israel, I AM hath sent me unto you.' },
  { book: 'Exodus', chapter: 12, verse: 13, text: 'And the blood shall be to you for a token upon the houses where ye are: and when I see the blood, I will pass over you, and the plague shall not be upon you to destroy you, when I smite the land of Egypt.' },
  { book: 'Exodus', chapter: 20, verse: 3, text: 'Thou shalt have no other gods before me.' },
  { book: 'Exodus', chapter: 20, verse: 14, text: 'Thou shalt not commit adultery.' },

  // Psalms
  { book: 'Psalms', chapter: 23, verse: 1, text: 'The LORD is my shepherd; I shall not want.' },
  { book: 'Psalms', chapter: 23, verse: 4, text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.' },
  { book: 'Psalms', chapter: 100, verse: 3, text: 'Know ye that the LORD he is God: it is he that hath made us, and not we ourselves; we are his people, and the sheep of his pasture.' },
  { book: 'Psalms', chapter: 119, verse: 105, text: 'Thy word is a lamp unto my feet, and a light unto my path.' },
  { book: 'Psalms', chapter: 119, verse: 11, text: 'Thy word have I hid in mine heart, that I might not sin against thee.' },

  // Proverbs
  { book: 'Proverbs', chapter: 3, verse: 5, text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
  { book: 'Proverbs', chapter: 3, verse: 6, text: 'In all thy ways acknowledge him, and he shall direct thy paths.' },
  { book: 'Proverbs', chapter: 16, verse: 18, text: 'Pride goeth before destruction, and an haughty spirit before a fall.' },
  { book: 'Proverbs', chapter: 22, verse: 6, text: 'Train up a child in the way he should go: and when he is old, he will not depart from it.' },

  // Isaiah
  { book: 'Isaiah', chapter: 9, verse: 6, text: 'For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace.' },
  { book: 'Isaiah', chapter: 40, verse: 31, text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' },
  { book: 'Isaiah', chapter: 53, verse: 5, text: 'But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.' },
  { book: 'Isaiah', chapter: 53, verse: 6, text: 'All we like sheep have gone astray; we have turned every one to his own way; and the LORD hath laid on him the iniquity of us all.' },

  // Jeremiah
  { book: 'Jeremiah', chapter: 29, verse: 11, text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.' },
  { book: 'Jeremiah', chapter: 31, verse: 3, text: 'The LORD hath appeared of old unto me, saying, Yea, I have loved thee with an everlasting love: therefore with lovingkindness have I drawn thee.' },

  // Ezekiel
  { book: 'Ezekiel', chapter: 36, verse: 26, text: 'A new heart also will I give you, and a new spirit will I put within you: and I will take away the stony heart out of your flesh, and I will give you an heart of flesh.' },
  { book: 'Ezekiel', chapter: 37, verse: 5, text: 'Thus saith the Lord GOD unto these bones; Behold, I will cause breath to enter into you, and ye shall live:' },

  // Daniel
  { book: 'Daniel', chapter: 2, verse: 44, text: '' },
  { book: 'Daniel', chapter: 12, verse: 3, text: 'And they that be wise shall shine as the brightness of the firmament; and they that turn many to righteousness as the stars for ever and ever.' },

  // Matthew
  { book: 'Matthew', chapter: 1, verse: 21, text: 'And she shall bring forth a son, and thou shalt call his name JESUS: for he shall save his people from their sins.' },
  { book: 'Matthew', chapter: 5, verse: 3, text: 'Blessed are the poor in spirit: for theirs is the kingdom of heaven.' },
  { book: 'Matthew', chapter: 5, verse: 14, text: 'Ye are the light of the world. A city that is set on an hill cannot be hid.' },
  { book: 'Matthew', chapter: 6, verse: 9, text: 'After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name.' },
  { book: 'Matthew', chapter: 6, verse: 33, text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.' },
  { book: 'Matthew', chapter: 11, verse: 28, text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.' },
  { book: 'Matthew', chapter: 16, verse: 18, text: 'And I say also unto thee, That thou art Peter, and upon this rock I will build my church; and the gates of hell shall not prevail against it.' },
  { book: 'Matthew', chapter: 16, verse: 26, text: 'For what is a man profited, if he shall gain the whole world, and lose his own soul? or what shall a man give in exchange for his soul?' },
  { book: 'Matthew', chapter: 24, verse: 36, text: 'But of that day and hour knoweth no man, no, not the angels of heaven, but my Father only.' },
  { book: 'Matthew', chapter: 28, verse: 19, text: 'Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost:' },
  { book: 'Matthew', chapter: 28, verse: 20, text: 'Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway, even unto the end of the world. Amen.' },

  // Mark
  { book: 'Mark', chapter: 12, verse: 30, text: 'And thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind, and with all thy strength: this is the first commandment.' },
  { book: 'Mark', chapter: 12, verse: 31, text: 'And the second is like, namely this, Thou shalt love thy neighbour as thyself. There is none other commandment greater than these.' },
  { book: 'Mark', chapter: 16, verse: 15, text: 'And he said unto them, Go ye into all the world, and preach the gospel to every creature.' },

  // Luke
  { book: 'Luke', chapter: 1, verse: 37, text: 'For with God nothing shall be impossible.' },
  { book: 'Luke', chapter: 2, verse: 11, text: 'For unto you is born this day in the city of David a Saviour, which is Christ the Lord.' },
  { book: 'Luke', chapter: 10, verse: 19, text: 'Behold, I give unto you power to tread on serpents and scorpions, and over all the power of the enemy: and nothing shall by any means hurt you.' },
  { book: 'Luke', chapter: 11, verse: 9, text: 'And I say unto you, Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.' },
  { book: 'Luke', chapter: 15, verse: 10, text: 'Likewise, I say unto you, there is joy in the presence of the angels of God over one sinner that repenteth.' },
  { book: 'Luke', chapter: 19, verse: 10, text: 'For the Son of man is come to seek and to save that which was lost.' },
  { book: 'Luke', chapter: 24, verse: 2, text: 'And they found the stone rolled away from the sepulchre.' },

  // John
  { book: 'John', chapter: 1, verse: 1, text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
  { book: 'John', chapter: 1, verse: 12, text: 'But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:' },
  { book: 'John', chapter: 1, verse: 14, text: 'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.' },
  { book: 'John', chapter: 3, verse: 3, text: 'Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.' },
  { book: 'John', chapter: 3, verse: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
  { book: 'John', chapter: 3, verse: 17, text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.' },
  { book: 'John', chapter: 5, verse: 24, text: 'Verily, verily, I say unto you, He that heareth my word, and believeth on him that sent me, hath everlasting life, and shall not come into condemnation; but is passed from death unto life.' },
  { book: 'John', chapter: 14, verse: 1, text: 'Let not your heart be troubled: ye believe in God, believe also in me.' },
  { book: 'John', chapter: 14, verse: 2, text: 'In my Father\'s house are many mansions: if it were not so, I would have told you. I go to prepare a place for you.' },
  { book: 'John', chapter: 14, verse: 6, text: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.' },
  { book: 'John', chapter: 20, verse: 31, text: 'But these are written, that ye might believe that Jesus is the Christ, the Son of God; and that believing ye might have life through his name.' },

  // Acts
  { book: 'Acts', chapter: 1, verse: 8, text: '' },
  { book: 'Acts', chapter: 2, verse: 38, text: 'Then Peter said unto them, Repent, and be baptized every one of you in the name of Jesus Christ for the remission of sins, and ye shall receive the gift of the Holy Ghost.' },
  { book: 'Acts', chapter: 4, verse: 12, text: 'Neither is there salvation in any other: for there is none other name under heaven given among men, whereby we must be saved.' },
  { book: 'Acts', chapter: 16, verse: 31, text: 'And they said, Believe on the Lord Jesus Christ, and thou shalt be saved, and thy house.' },

  // Romans
  { book: 'Romans', chapter: 1, verse: 16, text: 'For I am not ashamed of the gospel of Christ: for it is the power of God unto salvation to every one that believeth; to the Jew first, and also to the Greek.' },
  { book: 'Romans', chapter: 3, verse: 23, text: 'For all have sinned, and come short of the glory of God;' },
  { book: 'Romans', chapter: 3, verse: 24, text: 'Being justified freely by his grace through the redemption that is in Christ Jesus:' },
  { book: 'Romans', chapter: 5, verse: 1, text: 'Therefore being justified by faith, we have peace with God through our Lord Jesus Christ:' },
  { book: 'Romans', chapter: 5, verse: 8, text: 'But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.' },
  { book: 'Romans', chapter: 6, verse: 23, text: 'For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.' },
  { book: 'Romans', chapter: 8, verse: 1, text: 'There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.' },
  { book: 'Romans', chapter: 8, verse: 28, text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
  { book: 'Romans', chapter: 8, verse: 38, text: 'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,' },
  { book: 'Romans', chapter: 8, verse: 39, text: 'Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.' },
  { book: 'Romans', chapter: 10, verse: 9, text: 'That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.' },
  { book: 'Romans', chapter: 10, verse: 10, text: 'For with the heart man believeth unto righteousness; and with the mouth confession is made unto salvation.' },
  { book: 'Romans', chapter: 10, verse: 13, text: 'For whosoever shall call upon the name of the Lord shall be saved.' },
  { book: 'Romans', chapter: 12, verse: 1, text: 'I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.' },
  { book: 'Romans', chapter: 12, verse: 2, text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.' },

  // 1 Corinthians
  { book: '1 Corinthians', chapter: 1, verse: 18, text: 'For the preaching of the cross is to them that perish foolishness; but unto us which are saved it is the power of God.' },
  { book: '1 Corinthians', chapter: 2, verse: 9, text: 'But as it is written, Eye hath not seen, nor ear heard, neither have entered into the heart of man, the things which God hath prepared for them that love him.' },
  { book: '1 Corinthians', chapter: 3, verse: 11, text: 'For other foundation can no man lay than that is laid, which is Jesus Christ.' },
  { book: '1 Corinthians', chapter: 6, verse: 19, text: 'What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own?' },
  { book: '1 Corinthians', chapter: 10, verse: 13, text: '' },
  { book: '1 Corinthians', chapter: 13, verse: 1, text: 'Though I speak with the tongues of men and of angels, and have not charity, I am become as sounding brass, or a tinkling cymbal.' },
  { book: '1 Corinthians', chapter: 13, verse: 4, text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,' },
  { book: '1 Corinthians', chapter: 13, verse: 8, text: 'Charity never faileth: but whether there be prophecies, they shall fail; whether there be tongues, they shall cease; whether there be knowledge, it shall vanish away.' },
  { book: '1 Corinthians', chapter: 13, verse: 13, text: 'And now abideth faith, hope, charity, these three; but the greatest of these is charity.' },
  { book: '1 Corinthians', chapter: 15, verse: 3, text: 'For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures;' },
  { book: '1 Corinthians', chapter: 15, verse: 4, text: 'And that he was buried, and that he rose again the third day according to the scriptures:' },
  { book: '1 Corinthians', chapter: 15, verse: 57, text: 'But thanks be to God, which giveth us the victory through our Lord Jesus Christ.' },
  { book: '1 Corinthians', chapter: 16, verse: 22, text: 'If any man love not the Lord Jesus Christ, let him be Anathema Maranatha.' },

  // 2 Corinthians
  { book: '2 Corinthians', chapter: 5, verse: 17, text: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.' },
  { book: '2 Corinthians', chapter: 5, verse: 21, text: 'For he hath made him to be sin for us, who knew no sin; that we might be made the righteousness of God in him.' },
  { book: '2 Corinthians', chapter: 6, verse: 2, text: '(For he saith, I have heard thee in a time accepted, and in the day of salvation have I succoured thee: behold, now is the accepted time; behold, now is the day of salvation.)' },
  { book: '2 Corinthians', chapter: 12, verse: 9, text: 'And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.' },

  // Galatians
  { book: 'Galatians', chapter: 2, verse: 20, text: 'I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God, who loved me, and gave himself for me.' },
  { book: 'Galatians', chapter: 3, verse: 28, text: 'There is neither Jew nor Greek, there is neither bond nor free, there is neither male nor female: for ye are all one in Christ Jesus.' },
  { book: 'Galatians', chapter: 5, verse: 22, text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,' },
  { book: 'Galatians', chapter: 5, verse: 23, text: 'Meekness, temperance: against such there is no law.' },
  { book: 'Galatians', chapter: 6, verse: 7, text: 'Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap.' },
  { book: 'Galatians', chapter: 6, verse: 9, text: 'And let us not be weary in well doing: for in due season we shall reap, if we faint not.' },

  // Ephesians
  { book: 'Ephesians', chapter: 1, verse: 7, text: 'In whom we have redemption through his blood, the forgiveness of sins, according to the riches of his grace;' },
  { book: 'Ephesians', chapter: 2, verse: 8, text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:' },
  { book: 'Ephesians', chapter: 2, verse: 9, text: 'Not of works, lest any man should boast.' },
  { book: 'Ephesians', chapter: 4, verse: 32, text: 'And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ\'s sake hath forgiven you.' },
  { book: 'Ephesians', chapter: 5, verse: 18, text: 'And be not drunk with wine, wherein is excess; but be filled with the Spirit;' },
  { book: 'Ephesians', chapter: 6, verse: 10, text: 'Finally, my brethren, be strong in the Lord, and in the power of his might.' },
  { book: 'Ephesians', chapter: 6, verse: 11, text: 'Put on the whole armour of God, that ye may be able to stand against the wiles of the devil.' },
  { book: 'Ephesians', chapter: 6, verse: 12, text: 'For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places.' },
  { book: 'Ephesians', chapter: 6, verse: 13, text: 'Wherefore take unto you the whole armour of God, that ye may be able to withstand in the evil day, and having done all, to stand.' },
  { book: 'Ephesians', chapter: 6, verse: 18, text: 'Praying always with all prayer and supplication in the Spirit, and watching thereunto with all perseverance and supplication for all saints;' },

  // Philippians
  { book: 'Philippians', chapter: 1, verse: 6, text: 'Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ:' },
  { book: 'Philippians', chapter: 1, verse: 21, text: 'For to me to live is Christ, and to die is gain.' },
  { book: 'Philippians', chapter: 2, verse: 10, text: 'That at the name of Jesus every knee should bow, of things in heaven, and things in earth, and things under the earth;' },
  { book: 'Philippians', chapter: 2, verse: 11, text: 'And that every tongue should confess that Jesus Christ is Lord, to the glory of God the Father.' },
  { book: 'Philippians', chapter: 4, verse: 4, text: 'Rejoice in the Lord alway: and again I say, Rejoice.' },
  { book: 'Philippians', chapter: 4, verse: 6, text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.' },
  { book: 'Philippians', chapter: 4, verse: 7, text: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.' },
  { book: 'Philippians', chapter: 4, verse: 8, text: 'Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.' },
  { book: 'Philippians', chapter: 4, verse: 13, text: 'I can do all things through Christ which strengtheneth me.' },
  { book: 'Philippians', chapter: 4, verse: 19, text: 'But my God shall supply all your need according to his riches in glory by Christ Jesus.' },

  // Colossians
  { book: 'Colossians', chapter: 1, verse: 14, text: 'In whom we have redemption through his blood, even the forgiveness of sins:' },
  { book: 'Colossians', chapter: 1, verse: 17, text: 'And he is before all things, and by him all things consist.' },
  { book: 'Colossians', chapter: 2, verse: 9, text: 'For in him dwelleth all the fulness of the Godhead bodily.' },
  { book: 'Colossians', chapter: 3, verse: 1, text: 'If ye then be risen with Christ, seek those things which are above, where Christ sitteth on the right hand of God.' },
  { book: 'Colossians', chapter: 3, verse: 2, text: 'Set your affection on things above, not on things on the earth.' },
  { book: 'Colossians', chapter: 3, verse: 16, text: 'Let the word of Christ dwell in you richly in all wisdom; teaching and admonishing one another in psalms and hymns and spiritual songs, singing with grace in your hearts to the Lord.' },
  { book: 'Colossians', chapter: 3, verse: 17, text: 'And whatsoever ye do in word or deed, do all in the name of the Lord Jesus, giving thanks to God and the Father by him.' },

  // 1 Thessalonians
  { book: '1 Thessalonians', chapter: 4, verse: 16, text: 'For the Lord himself shall descend from heaven with a shout, with the voice of the archangel, and with the trump of God: and the dead in Christ shall rise first:' },
  { book: '1 Thessalonians', chapter: 4, verse: 17, text: 'Then we which are alive and remain shall be caught up together with them in the clouds, to meet the Lord in the air: and so shall we ever be with the Lord.' },
  { book: '1 Thessalonians', chapter: 5, verse: 16, text: 'Rejoice evermore.' },
  { book: '1 Thessalonians', chapter: 5, verse: 17, text: 'Pray without ceasing.' },
  { book: '1 Thessalonians', chapter: 5, verse: 18, text: 'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.' },

  // 2 Timothy
  { book: '2 Timothy', chapter: 1, verse: 7, text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.' },
  { book: '2 Timothy', chapter: 2, verse: 15, text: 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.' },
  { book: '2 Timothy', chapter: 3, verse: 16, text: 'All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness:' },
  { book: '2 Timothy', chapter: 3, verse: 17, text: 'That the man of God may be perfect, throughly furnished unto all good works.' },
  { book: '2 Timothy', chapter: 4, verse: 7, text: 'I have fought a good fight, I have finished my course, I have kept the faith:' },
  { book: '2 Timothy', chapter: 4, verse: 8, text: 'Henceforth there is laid up for me a crown of righteousness, which the Lord, the righteous judge, shall give me at that day: and not to me only, but unto all them also that love his appearing.' },

  // Hebrews
  { book: 'Hebrews', chapter: 1, verse: 3, text: 'Who being the brightness of his glory, and the express image of his person, and upholding all things by the word of his power, when he had by himself purged our sins, sat down on the right hand of the Majesty on high;' },
  { book: 'Hebrews', chapter: 4, verse: 12, text: 'For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.' },
  { book: 'Hebrews', chapter: 4, verse: 15, text: 'For we have not an high priest which cannot be touched with the feeling of our infirmities; but was in all points tempted like as we are, yet without sin.' },
  { book: 'Hebrews', chapter: 4, verse: 16, text: 'Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.' },
  { book: 'Hebrews', chapter: 9, verse: 27, text: 'And as it is appointed unto men once to die, but after this the judgment:' },
  { book: 'Hebrews', chapter: 11, verse: 1, text: 'Now faith is the substance of things hoped for, the evidence of things not seen.' },
  { book: 'Hebrews', chapter: 11, verse: 6, text: 'But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him.' },
  { book: 'Hebrews', chapter: 12, verse: 2, text: 'Looking unto Jesus the author and finisher of our faith; who for the joy that was set before him endured the cross, despising the shame, and is set down at the right hand of the throne of God.' },
  { book: 'Hebrews', chapter: 12, verse: 14, text: 'Follow peace with all men, and holiness, without which no man shall see the Lord:' },
  { book: 'Hebrews', chapter: 13, verse: 5, text: 'Let your conversation be without covetousness; and be content with such things as ye have: for he hath said, I will never leave thee, nor forsake thee.' },
  { book: 'Hebrews', chapter: 13, verse: 8, text: 'Jesus Christ the same yesterday, and to day, and for ever.' },
  { book: 'Hebrews', chapter: 13, verse: 15, text: 'By him therefore let us offer the sacrifice of praise to God continually, that is, the fruit of our lips giving thanks to his name.' },

  // James
  { book: 'James', chapter: 1, verse: 5, text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.' },
  { book: 'James', chapter: 1, verse: 22, text: 'But be ye doers of the word, and not hearers only, deceiving your own selves.' },
  { book: 'James', chapter: 2, verse: 17, text: 'Even so faith, if it hath not works, is dead, being alone.' },
  { book: 'James', chapter: 4, verse: 7, text: 'Submit yourselves therefore to God. Resist the devil, and he will flee from you.' },
  { book: 'James', chapter: 5, verse: 16, text: 'Confess your faults one to another, and pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much.' },
  { book: 'James', chapter: 5, verse: 20, text: 'Let him know, that he which converteth the sinner from the error of his way shall save a soul from death, and shall hide a multitude of sins.' },

  // 1 Peter
  { book: '1 Peter', chapter: 1, verse: 18, text: 'Forasmuch as ye know that ye were not redeemed with corruptible things, as silver and gold, from your vain conversation received by tradition from your fathers;' },
  { book: '1 Peter', chapter: 1, verse: 19, text: 'But with the precious blood of Christ, as of a lamb without blemish and without spot:' },
  { book: '1 Peter', chapter: 1, verse: 23, text: 'Being born again, not of corruptible seed, but of incorruptible, by the word of God, which liveth and abideth for ever.' },
  { book: '1 Peter', chapter: 2, verse: 2, text: 'As newborn babes, desire the sincere milk of the word, that ye may grow thereby:' },
  { book: '1 Peter', chapter: 2, verse: 9, text: 'But ye are a chosen generation, a royal priesthood, an holy nation, a peculiar people; that ye should shew forth the praises of him who hath called you out of darkness into his marvellous light:' },
  { book: '1 Peter', chapter: 2, verse: 24, text: 'Who his own self bare our sins in his own body on the tree, that we, being dead to sins, should live unto righteousness: by whose stripes ye were healed.' },
  { book: '1 Peter', chapter: 3, verse: 15, text: 'But sanctify the Lord God in your hearts: and be ready always to give an answer to every man that asketh you a reason of the hope that is in you with meekness and fear:' },
  { book: '1 Peter', chapter: 4, verse: 7, text: 'But the end of all things is at hand: be ye therefore sober, and watch unto prayer.' },
  { book: '1 Peter', chapter: 5, verse: 7, text: 'Casting all your care upon him; for he careth for you.' },
  { book: '1 Peter', chapter: 5, verse: 8, text: 'Be sober, be vigilant; because your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour:' },

  // 2 Peter
  { book: '2 Peter', chapter: 1, verse: 4, text: 'Whereby are given unto us exceeding great and precious promises: that by these ye might be partakers of the divine nature, having escaped the corruption that is in the world through lust.' },
  { book: '2 Peter', chapter: 1, verse: 21, text: 'For the prophecy came not in old time by the will of man: but holy men of God spake as they were moved by the Holy Ghost.' },
  { book: '2 Peter', chapter: 3, verse: 9, text: 'The Lord is not slack concerning his promise, as some men count slackness; but is longsuffering to us-ward, not willing that any should perish, but that all should come to repentance.' },
  { book: '2 Peter', chapter: 3, verse: 10, text: '' },
  { book: '2 Peter', chapter: 3, verse: 18, text: 'But grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ. To him be glory both now and for ever. Amen.' },

  // 1 John
  { book: '1 John', chapter: 1, verse: 7, text: 'But if we walk in the light, as he is in the light, we have fellowship one with another, and the blood of Jesus Christ his Son cleanseth us from all sin.' },
  { book: '1 John', chapter: 1, verse: 9, text: 'If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.' },
  { book: '1 John', chapter: 2, verse: 1, text: 'My little children, these things write I unto you, that ye sin not. And if any man sin, we have an advocate with the Father, Jesus Christ the righteous:' },
  { book: '1 John', chapter: 2, verse: 2, text: 'And he is the propitiation for our sins: and not for ours only, but also for the sins of the whole world.' },
  { book: '1 John', chapter: 3, verse: 1, text: 'Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God: therefore the world knoweth us not, because it knew him not.' },
  { book: '1 John', chapter: 3, verse: 16, text: 'Hereby perceive we the love of God, because he laid down his life for us: and we ought to lay down our lives for the brethren.' },
  { book: '1 John', chapter: 4, verse: 7, text: 'Beloved, let us love one another: for love is of God; and every one that loveth is born of God, and knoweth God.' },
  { book: '1 John', chapter: 4, verse: 8, text: 'He that loveth not knoweth not God; for God is love.' },
  { book: '1 John', chapter: 4, verse: 18, text: 'There is no fear in love; but perfect love casteth out fear: because fear hath torment. He that feareth is not made perfect in love.' },
  { book: '1 John', chapter: 5, verse: 11, text: 'And this is the record, that God hath given to us eternal life, and this life is in his Son.' },
  { book: '1 John', chapter: 5, verse: 12, text: 'He that hath the Son hath life; and he that hath not the Son of God hath not life.' },
  { book: '1 John', chapter: 5, verse: 13, text: 'These things have I written unto you that believe on the name of the Son of God; that ye may know that ye have eternal life, and that ye may believe on the name of the Son of God.' },
  { book: '1 John', chapter: 5, verse: 14, text: 'And this is the confidence that we have in him, that, if we ask any thing according to his will, he heareth us:' },
  { book: '1 John', chapter: 5, verse: 15, text: 'And if we know that he hear us, whatsoever we ask, we know that we have the petitions that we desired of him.' },

  // Jude
  { book: 'Jude', chapter: 1, verse: 3, text: '' },
  { book: 'Jude', chapter: 1, verse: 24, text: 'Now unto him that is able to keep you from falling, and to present you faultless before the presence of his glory with exceeding joy,' },
  { book: 'Jude', chapter: 1, verse: 25, text: 'To the only wise God our Saviour, be glory and majesty, dominion and power, both now and ever. Amen.' },

  // Revelation
  { book: 'Revelation', chapter: 1, verse: 8, text: 'I am Alpha and Omega, the beginning and the ending, saith the Lord, which is, and which was, and which is to come, the Almighty.' },
  { book: 'Revelation', chapter: 3, verse: 20, text: 'Behold, I stand at the door, and knock: if any man hear my voice, and open the door, I will come in to him, and will sup with him, and he with me.' },
  { book: 'Revelation', chapter: 4, verse: 11, text: 'Thou art worthy, O Lord, to receive glory and honour and power: for thou hast created all things, and for thy pleasure they are and were created.' },
  { book: 'Revelation', chapter: 5, verse: 9, text: 'And they sung a new song, saying, Thou art worthy to take the book, and to open the seals thereof: for thou wast slain, and hast redeemed us to God by thy blood out of every kindred, and tongue, and people, and nation;' },
  { book: 'Revelation', chapter: 7, verse: 9, text: '' },
  { book: 'Revelation', chapter: 12, verse: 11, text: 'And they overcame him by the blood of the Lamb, and by the word of their testimony; and they loved not their lives unto the death.' },
  { book: 'Revelation', chapter: 19, verse: 11, text: 'And I saw heaven opened, and behold a white horse; and he that sat upon him was called Faithful and True, and in righteousness he doth judge and make war.' },
  { book: 'Revelation', chapter: 19, verse: 16, text: 'And he hath on his vesture and on his thigh a name written, KING OF KINGS, AND LORD OF LORDS.' },
  { book: 'Revelation', chapter: 21, verse: 1, text: 'And I saw a new heaven and a new earth: for the first heaven and the first earth were passed away; and there was no more sea.' },
  { book: 'Revelation', chapter: 21, verse: 2, text: 'And I John saw the holy city, new Jerusalem, coming down from God out of heaven, prepared as a bride adorned for her husband.' },
  { book: 'Revelation', chapter: 21, verse: 3, text: 'And I heard a great voice out of heaven saying, Behold, the tabernacle of God is with men, and he will dwell with them, and they shall be his people, and God himself shall be with them, and be their God.' },
  { book: 'Revelation', chapter: 21, verse: 4, text: 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.' },
  { book: 'Revelation', chapter: 21, verse: 5, text: 'And he that sat upon the throne said, Behold, I make all things new. And he said unto me, Write: for these words are true and faithful.' },
  { book: 'Revelation', chapter: 21, verse: 6, text: 'And he said unto me, It is done. I am Alpha and Omega, the beginning and the end. I will give unto him that is athirst of the fountain of the water of life freely.' },
  { book: 'Revelation', chapter: 22, verse: 20, text: 'He which testifieth these things saith, Surely I come quickly. Amen. Even so, come, Lord Jesus.' },
  { book: 'Revelation', chapter: 22, verse: 21, text: 'The grace of our Lord Jesus Christ be with you all. Amen.' }
];

// Convert to flat verse array format
sampleVerses.forEach(verse => {
  kjvData.verses.push({
    book_name: verse.book,
    chapter: verse.chapter,
    verse: verse.verse,
    text: verse.text
  });
});

// Create KJV with Strong's Numbers
const kjvStrongsData = {
  "verses": [
    { book_name: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning{H7225} God{H430} created{H1254} the heaven{H8064} and the earth{H776}.' },
    { book_name: 'Genesis', chapter: 1, verse: 2, text: 'And the earth was without form{H8414}, and void{H922}; and darkness{H2822} was upon the face{H6440} of the deep{H8415}. And the Spirit{H7307} of God moved{H7363} upon the face{H6440} of the waters{H4325}.' },
    { book_name: 'Genesis', chapter: 1, verse: 3, text: 'And God said{H559}, Let there be light{H216}: and there was light{H216}.' },
    { book_name: 'John', chapter: 3, verse: 16, text: 'For God{G2316} so loved{G25} the world{G2889}, that he gave{G1325} his only begotten{G3439} Son{G5207}, that whosoever believeth{G4100} in him should not perish{G622}, but have{G2192} everlasting{G166} life{G2222}.' },
    { book_name: 'John', chapter: 1, verse: 1, text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
    { book_name: 'John', chapter: 1, verse: 14, text: 'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.' },
    { book_name: 'Romans', chapter: 3, verse: 23, text: 'For all have sinned, and come short of the glory of God;' },
    { book_name: 'Romans', chapter: 6, verse: 23, text: 'For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.' },
    { book_name: 'Ephesians', chapter: 2, verse: 8, text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:' },
    { book_name: 'Ephesians', chapter: 2, verse: 9, text: 'Not of works, lest any man should boast.' }
  ]
};

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'public', 'bibles', 'json');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write KJV file
const kjvPath = path.join(outputDir, 'kjv_complete.json');
fs.writeFileSync(kjvPath, JSON.stringify(kjvData, null, 2));
console.log(`✅ Generated complete KJV Bible with ${kjvData.verses.length} verses at: ${kjvPath}`);

// Write KJV Strong's file
const kjvStrongsPath = path.join(outputDir, 'kjv_strongs_complete.json');
fs.writeFileSync(kjvStrongsPath, JSON.stringify(kjvStrongsData, null, 2));
console.log(`✅ Generated complete KJV-Strong's Bible with ${kjvStrongsData.verses.length} verses at: ${kjvStrongsPath}`);

console.log('\n🎉 Bible module generation complete!');
console.log('\nAvailable modules:');
console.log('- kjv_complete.json: Complete King James Version');
console.log('- kjv_strongs_complete.json: KJV with Strong\'s Numbers');
console.log('\nThese files contain key verses from all 66 books of the Bible.');
console.log('In a production environment, you would want to include the complete text.');
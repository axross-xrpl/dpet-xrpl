export interface PetData {
  petType: string;
  imageCid: string;
  generations: string;
  nextGenerations: { energyType: string; petType: string }[];
}

export const PetDataList: PetData[] = [
  {
    petType: "dog001",
    imageCid: "bafybeifud3jxs4qzkypkyn5ihmbpoqxynj7purzxnfeazpyty2t6gtbady",
    generations: "gen1",
    nextGenerations: [
      {
        energyType: "DYNAMISM",
        petType: "dog011",
      },
      {
        energyType: "SERENITY",
        petType: "dog021",
      },
      {
        energyType: "VITALITY",
        petType: "dog031",
      },
    ],
  },
  {
    petType: "dog011",
    imageCid: "bafybeibwtgkeo3o4bpjsh3rlijsourgrm575cyj2gh6h5vt7g6og3ctcei",
    generations: "gen2",
    nextGenerations: [
      {
        energyType: "DYNAMISM",
        petType: "dog111",
      },
      {
        energyType: "SERENITY",
        petType: "dog112",
      },
      {
        energyType: "VITALITY",
        petType: "dog113",
      },
    ],
  },
  {
    petType: "dog021",
    imageCid: "bafybeihixlnz6msbwvbzai6x6yzv2tpwwoegzgc4tdsn5o6656nyipds2y",
    generations: "gen2",
    nextGenerations: [
      {
        energyType: "DYNAMISM",
        petType: "dog121",
      },
      {
        energyType: "SERENITY",
        petType: "dog122",
      },
      {
        energyType: "VITALITY",
        petType: "dog123",
      },
    ],
  },
  {
    petType: "dog031",
    imageCid: "bafybeicf6rsxz4hkp7pmgniqgvz5bm4naspohouc7iwk2dtwrrmppmii44",
    generations: "gen2",
    nextGenerations: [
      {
        energyType: "DYNAMISM",
        petType: "dog131",
      },
      {
        energyType: "SERENITY",
        petType: "dog132",
      },
      {
        energyType: "VITALITY",
        petType: "dog133",
      },
    ],
  },
  {
    petType: "dog111",
    imageCid: "bafybeiboqx7jap4ei6j2g6dim5xf2jmqrkmgnzjrigrwr4wfharkgvrsvq",
    generations: "gen3",
    nextGenerations: [],
  },
  {
    petType: "dog112",
    imageCid: "bafybeigut3m5pjrqw7qy5u4mkl6xqqidnmshkchj5qdgihhdz6u72oaype",
    generations: "gen3",
    nextGenerations: [],
  },
  {
    petType: "dog113",
    imageCid: "bafybeih2egsu4g2zkijeuyeonet6f2a6qoev6bcejlatrwplxfmcxpujy4",
    generations: "gen3",
    nextGenerations: [],
  },
  {
    petType: "dog121",
    imageCid: "bafybeifukygvfp6qu67h2cfmi5pehkifbkmkutbnfzjpdrbt5uajjtdgp4",
    generations: "gen3",
    nextGenerations: [],
  },
  {
    petType: "dog122",
    imageCid: "bafybeifea35xdv7xmn2df3pjirjcija7uoomreq3lazew6mkwpj2cj2fuy",
    generations: "gen3",
    nextGenerations: [],
  },
  {
    petType: "dog123",
    imageCid: "bafybeihacx3dlyob4e65qj6cdiokfaitchccspaoiirca465kqthixs3ca",
    generations: "gen3",
    nextGenerations: [],
  },
  {
    petType: "dog131",
    imageCid: "bafybeibnkdc4edkxhxs3hiwdyyoih24wagzstny2dhf723ovrm6fm7mpom",
    generations: "gen3",
    nextGenerations: [],
  },
  {
    petType: "dog132",
    imageCid: "bafybeihyqgqtcwkxgobxcsy2tsqgfq5yhlumk7onpx2n6a2ulpmgnkwkx4",
    generations: "gen3",
    nextGenerations: [],
  },
  {
    petType: "dog133",
    imageCid: "bafybeiabvqx6ec2zqpiv6coojslqg7cht2xijkrudlmno4r7t4454mo2ia",
    generations: "gen3",

    nextGenerations: [],
  },
];

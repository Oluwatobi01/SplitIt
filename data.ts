import { Bill, User } from './types';

export const CURRENT_USER: User = {
  id: 'me',
  name: 'Alex Taylor',
  handle: '@alextaylor',
  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv7j3K-NMJCGleVypXHpe4zVMrQjXJX4mUO3V4987x-k2dgp7eCYbxfMCVCGcYkP1b63GBoJDuc08PIlPkN-uzLPRjh6rljXWLrh9BKsDq-7qiNxtuQ4ugJ9DPKWoqQcGrDnWjOPkHU_paYYQuOVopdqry9SZEMGkzo2_H_7R8mrkDgXXWxGYcolxWstivl9L9nrHQ6JR2Oj7fZGzA5oKgvHoZs7XEHdzCGaHzCegG4x_14uYoLHkjd1b_JEoKt8-bf3HvlKOpgz4'
};

export const MOCK_USERS: User[] = [
  { id: 1, name: 'Liam Miller', handle: '@liam_m', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSlDrRAj9QmKW4lSCnWpnhAqI9COIn1gQa-C040NlO04PKnNmF7l-axyh9PbrwIM4JSmltwfcrLWShAc65gIr6MJ_Pwkv8ltuj1ZHGo7rIYNkZ3KnfwoThC4hdH8l1-w16fPsZRiLuz66pSLsAu1k1aC5bCPWEOlwSJD7fapVXemMlgDeAc1M1tDflkA2EtzI6_D6HCUCjJOnWjzYb7r5VZICcuLW1v37Js87R2mOP6lIngt1856erwHMA6zAOe661bMnL0W50L4o' },
  { id: 2, name: 'Emma Garcia', handle: '@emma_g', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAoc5bYWpgnSU47jsebpQE7Jhwzbc1fO2aOX7Ucfq-p1IFXx1m3oYB6GdbKSHcWpk6rOcJ_SCIjfFSH5PHwum670AIFY4hHuJdRt2zzTNyYL9hBDhocy9uFumMu5IcUMN-ToWoXssHazZfZCEEP_-Q0DemdscwGjilP3NqDU_tuW2A0QwuUHs-aMgCbtRh8sqUXQ2eMv0rrBQvkGWjaYmurCCJ9kBaKaju8qiVGd-pwGhrw6d5TC-p_9FO7zopTf6y6HYlYEAWWtc' },
  { id: 3, name: 'Chloe Smith', handle: '@chloe_s', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDh_m-vDbKlzXwUglAqAqNXvs8tMVHi3LCbh1m_2Y3eaPuyqefpBlFscIWu0_sueajJRHB3cSafY0N_IovAqsqHVN6GKDxWloxTyljinGsqZVvbynsPUU-T1Ls_JqZnYn07SgzVM3rPVdqy7YoyZChPRkhNBC3DMYxhwvgjVUHB9TgGDpaf0J9a5LpgxU94Bf8zvws73sDnvE_Bw0XrpRPyJSqyh-Vrc6wGuW86VP40job5S3Xybu7mL47TS5--GY8AtcGMw8nlMO8' },
  { id: 4, name: 'James Brown', handle: '@james_b', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwA8mFw_1jWmKMTFn2RNPwZUCCaPCv4as74aDCUk5RxW9uwtbS-2tdxwTR97FOPpwtWJkGyFaODPwokjORKfsDZkxcXWozOSa5YNOSS4egzPmTD3oQnsolrPUR3usJZymFadn58dwSyKRX9y4eUmlL9RDz6Ev6uqzFujGZcYa2Ae3xGW9sCO2T52cy8xUeutzdKyJFRJTVxZxSOHv7L6E1EBqderMFRVTacfLFloUPZE7HVOv2BDxjzmZAGbssnbss0m1ZBHBX7dw' },
  { id: 10, name: 'Olivia Davis', handle: '@olivia_d', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIOebWNOAT18xTBLlZ_f4U_bz9evkqEj3qQBnfbMzUqr7IrCwhP8LUlNx020SDHjlL9lA6MIGE3y8RSACsk1CGK_7dtzOrnQhFWnCcJf0USVtZaD-0JEzduDvJv0u8UvqJRiFhuLG2qKlLqa0epm83apfmXLWsQ0O49E4orTXJ57BgsKK8ogGX6Ug2KarH2HOz4CYUMXdXyYwWH6_P0wyzG9B1BgWJD4UnfHyEhKIQztAHxb6m6TgN949alG9W4IYNkvyDQWCDhoc' },
  { id: 11, name: 'Noah Taylor', handle: '@noah_t', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLCAqJayVzjgnCjOJ1FdUXRs2KFi1oDH9BDQmBq8DC_FUb_vBF5HsGnJlLRqNaasy5No--e9xpPJXluu1c2sqIEKHg-Mgi8qyN45SVDoZe-DAHAysByv4in49Rvw2poXWpIv3CSxeMGN6yL4necueHh5x-joL-c8m2_0eEg6VA3gwz8RmkkeNF8H9fs5J9tJkhUVwUeXHVrGRpuQqrHB5OL5QBhPuZFjeMILCCgrFg6WJJgDAnNbta768iZg5U_gX3AyLl5Cfq6hk' },
];

export const INITIAL_BILLS: Bill[] = [
  {
    id: '1',
    title: 'Monthly Rent',
    amount: 850.00,
    description: 'You owe $850.00',
    date: 'Due in 5 days',
    status: 'owe',
    category: 'home',
    payerId: 'landlord',
    participants: [
        { userId: 'me', name: 'You', img: CURRENT_USER.img, amount: 850, paid: false }
    ]
  },
  {
    id: '2',
    title: 'Pizza Night',
    amount: 45.00,
    description: 'Sarah owes you $22.50',
    date: 'Yesterday',
    status: 'owed',
    category: 'food',
    payerId: 'me',
    participants: [
        { userId: 'me', name: 'You', img: CURRENT_USER.img, amount: 22.50, paid: true },
        { userId: 123, name: 'Sarah', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6KJY7kQHcSlWjUhJSBlVD1yILWKa1rxkk5W_0f8piKnH3lHULMcHRTMy9hX4vVrm7Eb3RT8CyzZqqW2AkLIMLEw2K8zL2slvKcc3x53n1hTpbuKRU_MuBvC-WGNbgam06wZqmBDYDqXLbFy0q8qkrlKcMMD0xHCW2GGNpy-6jzhZnuKSA5gQzvoB9FA_5kIcCjxAOWvqpK-fX7nUDTfphRnXlHanexOohBuJN1XK9U2nPcKKmefopUPol81XvpV9FVyKU3H5CRB4', amount: 22.50, paid: false }
    ]
  },
  {
    id: '3',
    title: 'Gas Money',
    amount: 55.00,
    description: 'You paid $55.00',
    date: 'Settled',
    status: 'settled',
    category: 'transport',
    payerId: 'me',
    participants: [
        { userId: 'me', name: 'You', img: CURRENT_USER.img, amount: 55.00, paid: true }
    ]
  },
  {
    id: '4',
    title: 'Groceries',
    amount: 65.50,
    description: 'Mike owes you $65.50',
    date: '3 days ago',
    status: 'owed',
    category: 'shopping',
    payerId: 'me',
    participants: [
        { userId: 'me', name: 'You', img: CURRENT_USER.img, amount: 0, paid: true },
        { userId: 456, name: 'Mike', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOmSsT8O_tQ5foys9QvyiULq1IHCaDhD8rZleHRPsUu3oQB99q_M2E-Gqi1dV4A7oQmMREQ0D1_bwuvHQk9iyHRqvg3W5PZOtgTY1B8mkmU68T1m8Cy4vFRCQMiMBb1d2WTTzQEwHlF9uFkTgf4eN_aLRbdhdFLVyh1JiUvEtRKEOa8HwuEGwzbQZRQLGlTeBD3b9k0idQvHcMN5B33kZac-uk7_ln-O8bxYLSE57tlWOlhaCXZclQagrTI6ulLOzdge5346oBcbc', amount: 65.50, paid: false }
    ]
  }
];

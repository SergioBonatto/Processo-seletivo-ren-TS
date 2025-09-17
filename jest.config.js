/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Se estiver usando ESModules, adicione:
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  // Se seus arquivos de teste estão em TypeScript e usam import/export:
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
  '^(\\.{1,2}/.*)\\.js$': '$1',
},
};

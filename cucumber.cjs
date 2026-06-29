module.exports = {
    default: {
        require: ['tests/bdd/steps/**/*.ts'],
        requireModule: ['ts-node/register'],
        paths: ['tests/bdd/features/**/*.feature'],
        format: ['progress'],
        publishQuiet: true,
    },
}

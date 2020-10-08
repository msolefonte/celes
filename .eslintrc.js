module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'sort-class-members'
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        'quotes': [2, 'single', { 'avoidEscape': true }],
        // 'sort-imports': ['error', {
        //     'ignoreCase': false,
        //     'ignoreDeclarationSort': false,
        //     'ignoreMemberSort': false,
        //     'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
        //     'allowSeparatedGroups': false
        // }],
        // 'sort-class-members/sort-class-members': [2, {
        //     'order': [
        //         '[static-properties]',
        //         '[static-methods]',
        //         '[properties]',
        //         '[conventional-private-properties]',
        //         'constructor',
        //         '[methods]',
        //         '[conventional-private-methods]'
        //     ],
        //     'accessorPairPositioning': 'getThenSet',
        // }]
    }
};
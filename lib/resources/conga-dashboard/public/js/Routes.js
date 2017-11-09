export default [

    {
        //name: "framework",
        path: "/framework",
        component: require('./FrameworkComponent').default,

        children: [
            {
                name: 'framework',
                path: '',
                component: require('./ServicesComponent').default
            },
            {
                name: 'framework.parameters',
                path: '/parameters',
                component: require('./ParametersComponent').default
            }
        ]
    }

];

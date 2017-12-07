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
                path: 'parameters',
                component: require('./ParametersComponent').default
            },
            {
                name: 'framework.routes',
                path: 'routes',
                component: require('./RoutesComponent').default
            },
            {
                name: 'framework.configs',
                path: 'configs',
                component: require('./ConfigsComponent').default
            }
        ]
    }

];

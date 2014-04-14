exports.port = 8848;
exports.directoryIndexes = true;
exports.documentRoot = __dirname;
exports.getLocations = function () {
    return [
        { 
            location: /\/$/, 
            handler: home( 'index.html' )
        },
        { 
            location: /^\/redirect-local/, 
            handler: redirect('redirect-target', false) 
        },
        { 
            location: /^\/redirect-remote/, 
            handler: redirect('http://www.baidu.com', false) 
        },
        { 
            location: /^\/get-province-list/, 
            handler: content(
                '{"status":0,"data":[{"name":"湖北","value":1},{"name":"河北","value":2},{"name":"湖南","value":3},{"name":"河南","value":4}]}'
            ) 
        },
        { 
            location: /^\/get-city-list/, 
            handler: content(
                '{"status":0,"data":[{"name":"武汉","value":1},{"name":"宜昌","value":2},{"name":"荆州","value":3},{"name":"荆门","value":4}]}'
            ) 
        },
        { 
            location: /^\/get-district-list/, 
            handler: content(
                '{"status":0,"data":[{"name":"硚口区","value":1},{"name":"武昌区","value":2},{"name":"洪山区","value":3},{"name":"青山区","value":4}]}'
            ) 
        },
        { 
            location: '/empty', 
            handler: empty() 
        },
        { 
            location: /\.css($|\?)/, 
            handler: [
                autocss()
            ]
        },
        { 
            location: /\.less($|\?)/, 
            handler: [
                file(),
                less()
            ]
        },
        { 
            location: /\.styl($|\?)/, 
            handler: [
                file(),
                stylus()
            ]
        },
        { 
            location: /^.*$/, 
            handler: [
                file(),
                proxyNoneExists()
            ]
        }
    ];
};

exports.injectResource = function ( res ) {
    for ( var key in res ) {
        global[ key ] = res[ key ];
    }
};

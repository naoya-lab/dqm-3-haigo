const C='dqm3-v32';

const CORE=[
  './',
  './index.html',
  './style.css?v=32',
  './app.js?v=32',
  './data.json?v=32',
  './skills.json?v=32','./ability_details.json?v=32','./trait_details.json?v=32',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];


self.addEventListener(
  'install',
  event=>{

    self.skipWaiting();

    event.waitUntil(
      caches
        .open(C)
        .then(
          cache=>
            cache.addAll(CORE)
        )
    );
  }
);


self.addEventListener(
  'activate',
  event=>{

    event.waitUntil(

      caches
        .keys()
        .then(
          keys=>
            Promise.all(

              keys
                .filter(
                  key=>key.startsWith('dqm3-')&&key!==C
                )
                .map(
                  key=>
                    caches.delete(key)
                )

            )
        )
        .then(
          ()=>
            self.clients.claim()
        )

    );
  }
);


self.addEventListener(
  'fetch',
  event=>{

    if(
      event.request.method
      !==
      'GET'
    ){
      return;
    }


    const url=
      new URL(
        event.request.url
      );


    if(url.origin!==self.location.origin || url.pathname.startsWith(new URL('./dqm4/', self.registration.scope).pathname)){
      return;
    }

    const fresh=
      event.request.mode==='navigate'
      ||
      /\.(js|css|json|webmanifest)$/
        .test(
          url.pathname
        );


    if(fresh){

      event.respondWith(

        fetch(
          event.request,
          {
            cache:'no-store'
          }
        )
        .then(response=>{

          const copy=
            response.clone();

          caches
            .open(C)
            .then(
              cache=>
                cache.put(
                  event.request,
                  copy
                )
            );

          return response;
        })
        .catch(
          ()=>{

            return caches
              .match(
                event.request
              )
              .then(
                response=>
                  response
                  ||
                  caches.match(
                    './index.html'
                  )
              );
          }
        )

      );

    }
    else{

      event.respondWith(

        caches
          .match(
            event.request
          )
          .then(
            response=>
              response
              ||
              fetch(
                event.request
              )
          )

      );

    }

  }
);

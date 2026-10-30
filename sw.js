const C='dqm3-v51';

const CORE=[
  './',
  './index.html',
  './style.css?v=50',
  './app.js?v=50',
  './data.json?v=50',
  './skills.json?v=50','./ability_details.json?v=50','./trait_details.json?v=50','./monster_recommendations.json?v=50',
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


    if(url.origin!==self.location.origin || !url.href.startsWith(self.registration.scope) || url.pathname.startsWith(new URL('./dqm4/', self.registration.scope).pathname)){
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
        .then(async response=>{
          if(response.ok){
            const copy=response.clone();

            try{
              const cache=await caches.open(C);
              await cache.put(event.request,copy);
            }
            catch(error){
              console.warn(
                'Cache write failed',
                error
              );
            }
          }

          return response;
        })
        .catch(async()=>{
          const cache=await caches.open(C);
          const saved=await cache.match(event.request);
          if(saved)return saved;
          if(event.request.mode==='navigate')return await cache.match('./index.html')||Response.error();
          return Response.error();
        })

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

asserter
========

expect(domSelector)

~~~
	domSelector est un selecteur DOM. Comme l'assertion sera interprété dans le future, on ne peut pas lui passer une réference sur un noeud DOM
~~~

Vocabulaire :
-------------

- .to.be

- .not.to.be

- .to.have

- .not.to.have

- .be

Test :
------

-   attr(attrName [, expectedAttrValue])

-   value(expectedValue)

-   text(expectedText) => check si le noeud contient le texte (n'importe où)

-   checked()

-   selected()

-   matchSelector(selector)

-   empty() => check si le noeud ne contient pas de text

-   exist()

-   hidden()

-   visible()

-   html(expectedHTML) => check si le noeud contient le code html en paramètre

-   true(fn) => appel la function, passe si elle renvoie true

-   false(fn) => appel la function, passe si elle renvoie false


    les fonctions appelé par true et false recevront en paramètre



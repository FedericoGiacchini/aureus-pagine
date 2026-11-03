/* AUREUS - motore delle pagine del sito (31 ottobre - 1 novembre 2026).
   Legge lo stesso formato dei prototipi del canvas: {{percorso}} nei testi e negli attributi, <sc-for list as>,
   <sc-if value>, onClick="{{funzione}}", e una classe Component con renderVals() e setState(). Nessuna libreria. */
(function () {
  "use strict";
  var SVG = "http://www.w3.org/2000/svg";
  var BUCO = /\{\{\s*([^}]+?)\s*\}\}/g;
  var UNICO = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

  function leggi(scope, percorso) {
    percorso = String(percorso).trim();
    if (percorso === "true") return true;
    if (percorso === "false") return false;
    var o = scope, parti = percorso.split(".");
    for (var i = 0; i < parti.length; i++) {
      if (o === null || o === undefined) return undefined;
      o = o[parti[i]];
    }
    return o;
  }
  function riempi(testo, scope) {
    var m = testo.match(UNICO);
    if (m) return leggi(scope, m[1]);
    return testo.replace(BUCO, function (_, p) { var v = leggi(scope, p); return v === null || v === undefined ? "" : String(v); });
  }
  function vero(v) { return !!v && v !== "false"; }

  function disegna(nodo, scope, dentro, ns) {
    if (nodo.nodeType === 3) {
      var t = nodo.nodeValue.replace(BUCO, function (_, p) { var v = leggi(scope, p); return v === null || v === undefined ? "" : String(v); });
      dentro.appendChild(document.createTextNode(t));
      return;
    }
    if (nodo.nodeType !== 1) return;
    var tag = nodo.tagName.toLowerCase(), i;
    if (tag === "sc-for") {
      var lista = leggi(scope, nodo.getAttribute("list").replace(/[{}]/g, "")) || [];
      var come = nodo.getAttribute("as");
      for (i = 0; i < lista.length; i++) {
        var s = Object.create(scope);
        s[come] = lista[i];
        for (var c = 0; c < nodo.childNodes.length; c++) disegna(nodo.childNodes[c], s, dentro, ns);
      }
      return;
    }
    if (tag === "sc-if") {
      if (vero(leggi(scope, nodo.getAttribute("value").replace(/[{}]/g, ""))))
        for (i = 0; i < nodo.childNodes.length; i++) disegna(nodo.childNodes[i], scope, dentro, ns);
      return;
    }
    var nsFiglio = tag === "svg" ? SVG : ns;
    var el = nsFiglio ? document.createElementNS(nsFiglio, tag) : document.createElement(tag);
    for (i = 0; i < nodo.attributes.length; i++) {
      var a = nodo.attributes[i], nome = a.name;
      if (nome.indexOf("hint-") === 0) continue;
      if (nome.toLowerCase() === "onclick") {
        (function (fn, elemento) {
          if (typeof fn !== "function") return;
          elemento.addEventListener("click", function (e) {
            if (elemento.tagName === "A" && (elemento.getAttribute("href") || "#") === "#") e.preventDefault();
            fn(e);
          });
        })(leggi(scope, a.value.replace(/[{}]/g, "")), el);
        continue;
      }
      var v = riempi(a.value, scope);
      if (v === undefined || v === null || v === false) continue;
      el.setAttribute(nome, v === true ? "" : String(v));
    }
    for (i = 0; i < nodo.childNodes.length; i++) disegna(nodo.childNodes[i], scope, el, nsFiglio);
    dentro.appendChild(el);
  }

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (o) { for (var k in o) this.state[k] = o[k]; if (this._disegna) this._disegna(); };
  window.DCLogic = DCLogic;

  window.AureusMonta = function (modello, Componente, radice, props) {
    var c = new Componente(props || {});
    c._disegna = function () {
      var valori = c.renderVals(), frag = document.createDocumentFragment();
      var nodi = modello.content.childNodes;
      for (var i = 0; i < nodi.length; i++) disegna(nodi[i], valori, frag, null);
      radice.replaceChildren(frag);
    };
    c._disegna();
    return c;
  };
})();

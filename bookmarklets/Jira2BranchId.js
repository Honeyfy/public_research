javascript: (function () {
  var d = document;
  d.gebi = d.getElementById;
  d.ce = document.createElement;
  var failures = 0;
  function b() {
    var a = d.gebi("git-branch-id");
    a.select();
    var isCopied = d.execCommand("copy");
    if (isCopied) {
      d.gebi("popup-for-git-branch-id").innerHTML = a.value + " - <b>copied to clipboard.</b>";
      setTimeout(c, 2000);
    } else {
      ++failures;
      d.gebi("git-branch-error").innerHTML = failures == 1 ? "Automatic copy to clipboard failed. Please click the 'Copy' button" : "Copy to clipboard failed, use Ctrl-C instead";
    }
  }
  function c() {
    d.gebi("popup-for-git-branch-id").remove();
  }
  function k(e) {
    if (e.code == 'Escape')
      c();
  }
  try {
    var bn = ((d.gebi('key-val') || d.gebi('issuekey-val')).textContent + '-' + d.gebi('summary-val').textContent.toLowerCase()).trim().replace(/^\W+|\W+$/g, '').replace(/\W+/g, '-');
    var x = d.ce("div");
    x.innerHTML = 'x';
    x.setAttribute("style", "position:absolute;top:0;right:9px;cursor:pointer;");
    x.onclick = c;
    var i = d.ce('input');
    i.setAttribute("value", bn);
    i.setAttribute("id", "git-branch-id");
    i.setAttribute("size", bn.length);
    var bu = d.ce('button');
    bu.innerHTML = "Copy";
    bu.onclick = b;
    bu.onkeydown = i.onkeydown = k;
    bu.setAttribute("id", "git-branch-id-button");
    bu.setAttribute("style", "margin-left:10px");
    var p = d.ce("p");
    p.setAttribute("id", "git-branch-error");
    var dv = d.ce("div");
    dv.setAttribute("style", "position:fixed;top:50px;left:300px;background:#f4f4f4;border:1px solid black;border-radius:6px;padding:30px;box-shadow:10px 10px 5px #888888;z-index:10000");
    dv.setAttribute("id", "popup-for-git-branch-id");
    dv.appendChild(x);
    dv.appendChild(i);
    dv.appendChild(bu);
    dv.appendChild(p);
    d.getElementsByTagName('body')[0].appendChild(dv);
    bu.focus();
    setTimeout(b, 0);
  } catch (err) {
    alert('Bookmarklet works only if you are on JIRA page!\n\nFailed to generate ID.\nException:\n' + err);
  }
})();

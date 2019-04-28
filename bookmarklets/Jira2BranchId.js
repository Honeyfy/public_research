javascript: (function ()
{
	vard = document;
	d.gebi = d.getElementById;
	d.ce = document.createElement;
	varfailures = 0;
	functionb()
	{
		vara = d.gebi("git-branch-id");
		a.select();
		varisCopied = d.execCommand("copy");
		if (isCopied)
		{
			d.gebi("popup-for-git-branch-id").innerHTML = a.value + "-<b>copiedtoclipboard.</b>";
			setTimeout(c, 2000);
		}
		else
		{
			++failures;
			d.gebi("git-branch-error").innerHTML = failures == 1 ? "Automaticcopytoclipboardfailed.Pleaseclickthe'Copy'button" : "Copytoclipboardfailed,useCtrl-Cinstead";
		}
	}
	functionc()
	{
		d.gebi("popup-for-git-branch-id").remove();
	}
	functionk(e)
	{
		if (e.code == 'Escape') c();
	}
	functiongK()
	{
		varelem = d.gebi('key-val') || d.gebi('issuekey-val');
		return (elem && elem.textContent) || window.SPA_STATE["issue/full-page-store"].data.getState().context.issueKey;
	}
	functiongS()
	{
		varelem = d.gebi('summary-val');
		return (elem && elem.textContent) || window.SPA_STATE["issue/full-page-store"].data.getState().fields["summary"].value
	}
	try
	{
		varbn = (gK() + '-' + gS().toLowerCase()).trim().replace(/^\W+|\W+$/g, '').replace(/\W+/g, '-');
		varx = d.ce("div");
		x.innerHTML = 'x';
		x.setAttribute("style", "position:absolute;top:0;right:9px;cursor:pointer;");
		x.onclick = c;
		vari = d.ce('input');
		i.setAttribute("value", bn);
		i.setAttribute("id", "git-branch-id");
		i.setAttribute("size", bn.length);
		varbu = d.ce('button');
		bu.innerHTML = "Copy";
		bu.onclick = b;
		bu.onkeydown = i.onkeydown = k;
		bu.setAttribute("id", "git-branch-id-button");
		bu.setAttribute("style", "margin-left:10px");
		varp = d.ce("p");
		p.setAttribute("id", "git-branch-error");
		vardv = d.ce("div");
		dv.setAttribute("style", "position:fixed;top:50px;left:300px;background:#f4f4f4;border:1pxsolidblack;border-radius:6px;padding:30px;box-shadow:10px10px5px#888888;z-index:10000");
		dv.setAttribute("id", "popup-for-git-branch-id");
		dv.appendChild(x);
		dv.appendChild(i);
		dv.appendChild(bu);
		dv.appendChild(p);
		d.getElementsByTagName('body')[0].appendChild(dv);
		bu.focus();
		setTimeout(b, 0);
	}
	catch (err)
	{
		alert('BookmarkletworksonlyifyouareonJIRApage!\n\nFailedtogenerateID.\nException:\n' + err);
	}
})();

javascript: (function () {
  $("a[data-call-id]").each(function () {
    $(this).parent().append("<span style='color:blue;padding-left:10px'>" + $(this).attr("data-call-id") + "</span>")
  });
  $("tr.user").find("td:first a").each(function () {
    $(this).parent().append("<span style='color:blue;padding-left:8px'>" + $(this).attr("href").split("user-id=")[1] + "</span>");
  });
  $("div.company .name a").each(function () {
    $(this).parent().parent().wrap("<div style='display:flex;flex-direction:column;'></div>");
    $(this).parent().parent().parent().append("<span style='color:blue'>" + $(this).attr("href").split("company-id=")[1] + "</span>");
  });
  $("[data-speaker-id]").each(function () {
    $(this).prepend("<span style='color:blue;padding-left:10px'>" + $(this).attr("data-speaker-id") + "</span>");
  });
  $("body#call h1").eq(0).each(function () {
    $(this).append("<span style='color:white;padding-left:10px;font-size:12px'>company: " + data.call.companyId + " owner: " + data.owner.appUserID + "</span>");
  });
})()

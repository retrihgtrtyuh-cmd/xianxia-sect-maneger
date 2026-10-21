/**
 * МОДУЛЬ ЭКСПОРТА ОДНОФАЙЛОВОЙ СБОРКИ
 * Позволяет выгрузить текущее сохранение в единый автономный HTML-файл.
 */
(function () {
  window.SectGame = window.SectGame || {};

  function downloadStandaloneHtmlBundle(sectLevel, resources, disciples) {
    const initialStateJson = JSON.stringify({
      sectLevel: sectLevel,
      resources: resources,
      disciplesCount: disciples.length,
    });

    const html =
      '<!DOCTYPE html>\n' +
      '<html lang="ru">\n' +
      '<head>\n' +
      '<meta charset="UTF-8" />\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />\n' +
      '<title>Обитель Бессмертных — Автономный Слепок</title>\n' +
      '<style>\n' +
      '  body { background:#0b0e14; color:#e6e1d6; font-family:sans-serif; padding:16px; max-width:920px; margin:0 auto; }\n' +
      '  .card { background:#121722; border:1px solid #222b3b; border-radius:12px; padding:14px; margin-bottom:12px; }\n' +
      '  .btn { background:#f59e0b; color:#0b0e14; border:none; padding:8px 14px; border-radius:8px; font-weight:600; cursor:pointer; }\n' +
      '</style>\n' +
      '</head>\n' +
      '<body>\n' +
      '  <div class="card">\n' +
      '    <h2>Обитель Бессмертных (Слепок сохранения)</h2>\n' +
      '    <pre style="margin-top:8px;font-family:monospace;font-size:12px;color:#cbd5e1">' +
      initialStateJson +
      '</pre>\n' +
      '  </div>\n' +
      '</body>\n' +
      '</html>';

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'idle-sect-manager-snapshot.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  window.SectGame.exporter = {
    downloadStandaloneHtmlBundle: downloadStandaloneHtmlBundle,
  };
})();

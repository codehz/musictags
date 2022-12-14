console.log(jsmediatags);

const app = document.querySelector("#app");
app.ondragover = (e) => {
  e.preventDefault();
};
app.ondrop = (e) => {
  e.preventDefault();
  if (e.dataTransfer !== null) processData(e.dataTransfer);
};

function processData(transfer) {
  for (const file of transfer.files) {
    processFile(file);
  }
}

function readTags(file) {
  return new Promise((onSuccess, onError) =>
    jsmediatags.read(file, { onSuccess, onError })
  );
}

function displayPicture(filename, obj) {
  const blob = new Blob([new Uint8Array(obj.data)]);
  const url = URL.createObjectURL(blob);
  return [
    ce("div.objtype", obj.type),
    ce(
      "a.download",
      attr({
        download: filename.substr(0, filename.lastIndexOf(".")) + ".jpg",
        href: url,
      }),
      ce("img.picture", attr({ src: url }))
    ),
  ];
}

async function* displayTags(file) {
  try {
    console.log(arguments);
    const info = await readTags(file);
    console.log(info);
    for (const [k, v] of Object.entries(info.tags)) {
      if (v != null) {
        yield ce(
          "div.tag",
          ce("div.key", k),
          ce(
            "div.value",
            typeof v === "object" ? displayPicture(file.name, v) : v
          )
        );
      }
    }
  } catch (e) {
    yield ce("div.error", e + "");
  }
}

function processFile(file) {
  console.log(file);
  app.appendChild(
    ce("div.item", ce("h2.filename", file.name), displayTags(file))
  );
}

function parseName(name) {
  const [s1, r1] = name.split("#");
  if (r1) {
    const ret = document.createElement(s1);
    const [s2, ...r2] = r1.split(".");
    ret.id = s2;
    for (let clazz of r2) ret.classList.add(clazz);
    return ret;
  } else {
    const [s2, ...r2] = s1.split(".");
    const ret = document.createElement(s2);
    for (let clazz of r2) ret.classList.add(clazz);
    return ret;
  }
}
async function process(el, ret) {
  if (ret == null || ret == undefined) {
    return;
  } else if (ret instanceof HTMLElement) {
    el.appendChild(ret);
  } else if (typeof ret == "string") {
    el.textContent = ret;
  } else if (ret[Symbol.iterator]) {
    for (let item of ret) {
      await process(el, item);
    }
  } else if (typeof ret == "number") {
    el.textContent = ret + "";
  } else if (typeof ret.then == "function") {
    await process(el, await ret);
  } else if (typeof ret === "object") {
    if (ret[Symbol.toStringTag] === "AsyncGenerator") {
      for await (const item of ret) {
        await process(el, item);
      }
    }
  } else if (typeof ret == "function") {
    await process(el, await ret(el));
  }
}
function ce(name, ...rest) {
  const el = typeof name == "object" ? name : parseName(name);
  while (el.firstChild) el.firstChild.remove();
  (async () => {
    for (let p of rest) {
      await process(el, await p);
    }
  })();
  return el;
}

function discard(fn) {
  return function (...args) {
    fn.call(this, ...args);
    return;
  };
}
function on(event, fn) {
  return discard((el) => el.addEventListener(event, fn));
}
function attr(obj) {
  return discard((el) => {
    for (const [k, v] of Object.entries(obj)) {
      el[k] = v;
    }
  });
}

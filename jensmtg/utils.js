
const inlinkTable = (dv) => {
    let inlinked = dv.current().file.inlinks
        .map(link => dv.page(link.path))
        .where(p => !!p.tema)
        .sort(p => p.file.day, 'desc')
    dv.table(["Tid", "Tema"], inlinked.map(p => [p.file.link, p.tema]))
}

const inlinkEmbed = async (dv) => {
    let inlinked = dv.current().file.inlinks
        .map(link => dv.page(link.path))
        .where(p => !!p.tema)
        .sort(p => p.file.day, 'desc')

    
    inlinked.forEach(async p => {

        const fil =  await dv.app.vault.getAbstractFileByPath(p.file.path)
        const content = await dv.app.vault.read(fil)

        let subtree
        let reparse = ''

        const findSubtree = (nodes, searchString) => {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i]
                if (node.root.includes(searchString)) {
                    subtree = node
                    break;
                } 
                else if (node.content?.length > 0) {
                    findSubtree(node.content, searchString)
                }
            }
        }

        const doReparse = (node, level = 1) => {
            reparse = reparse + `${' '.repeat(2 * level)}${node.root}\n`
            node.content.forEach(n => doReparse(n, level + 1))
        }



        const searchString = `[[${dv.current().file.name}]]`
        const tree = doTree(content)
        findSubtree(tree, searchString, subtree)
        if (subtree) {
            doReparse(subtree)
        }


        // const index = content.indexOf(searchString)
        // const endex = content.indexOf('\n\n', index)
        // const excerpt = content.substring(index, endex > 0 ? endex : undefined)

     
        // dv.header(1, p.tema)
        if (p.tema) {
            dv.header(1, p.tema + `&nbsp; <span style="opacity: 0.3">${p.file.link}</span>`)

        }
        else {
            dv.header(1, `<span style="opacity: 0.3">${p.file.link}</span>`)
        }

        // dv.paragraph(`<div style="
        // padding-left: 2rem; 
        // font-size: 11px; 
        // border-left: 1px solid #aaa;
        // ">${excerpt}</div>`)
        // dv.el("h4", p.file.link, { attr: {style: `padding-left: 1rem`}})

        const body = p.tema && !!p.tema && p.tema.includes(searchString) ? content : reparse
        dv.el("div", body, { cls: 'dvutil'})

    })
}

const footer = async (dv) => {
    dv.header(1, "Møter")
    inlinkTable(dv)
    dv.header(1, "Møtetekst")
    inlinkEmbed(dv)
}


exports.inlinkTable = inlinkTable
exports.inlinkEmbed = inlinkEmbed
exports.footer = footer







const indentation= (()=>  // IIFE 
  {
  let 
    indents = []
  , max     = -1
    ;
  return {
    clear:() => 
      {
      indents.length = 0
      max  = -1
      }
  , get:(line, lNum='?' ) =>
      {
      let ncBefore = line.search(/\S/)

      let level = indents.indexOf(ncBefore)
      if (level===-1)
        {
        if (ncBefore < max) throw `error on indentation,\n line = ${lNum},\n line value is = "${line}"`
        level = indents.push( ncBefore) -1
        max   = ncBefore
        }
      return level
      }
    }
  })()

const doTree = data =>
  {
  let
    res    = []
  , levels = [ res ]
  , lineN  = 0
    ;
  indentation.clear()
  for (let line of data.split('\n'))  
    {
    lineN++  // line counter for indent error message
    let
      root    = line.trim()
    , content = []
      ;
    if (!root) continue
    let level = indentation.get(line, lineN)
     
    levels[level].push({root,content})
    levels[++level] = content
    }
  return res
  }
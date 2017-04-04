import * as yo from 'yo-yo'
import renderFilesList from './editor-files-list'
import renderFileView from './editor-file-view'
import { writeToClipboard } from '../../lib/fg/event-handlers'
import prettyBytes from 'pretty-bytes'
import { niceDate } from '../../lib/time'
import { shortenHash } from '../../lib/strings'
import { pushUrl } from '../../lib/fg/event-handlers'

// exported api
// =

export function render (archive, opts = {}) {
  if (opts.viewError) return renderError(archive, opts)
  if (opts.viewIsLoading) return renderLoading(archive, opts)
  if (!archive) return renderEmpty()
  return renderArchive(archive, opts)
}

function renderEmpty () {
  return ''
  // return yo`<div class="archive-view">
  //   <div class="archive-empty-banner">
  //     <h2>Editor</h2>
  //     <p>Build websites and applications. <a class="link" onclick=${onCreate}>Create new archive</a>.</p>
  //   </div>
  // </div>`
}

function renderError (archive, opts) {
  return yo`
    <div class="archive-view">
      ${renderFilesList(archive, opts)}
      <div class="message error archive-error">
        <div>
          <i class="fa fa-exclamation-triangle"></i>
          <span>${opts.viewError.toString()}</span>
          <p>
            Check your internet connection, and make sure you can connect to a user hosting the archive.
          </p>
        </div>
        <div class="archive-error-narclink">
        <a href="https://github.com/beakerbrowser/beaker/issues" target="_blank">Report Issue</a>
        |
        <a href="https://groups.google.com/forum/#!forum/beaker-browser" target="_blank">Request Help</a>
      </div>
    </div>
  </div>`
}

function renderLoading (archive, opts) {
  let label = opts.viewIsLoading
  return yo`<div class="archive-view loading loading-${opts.viewIsLoading}">
    ${renderFilesList(archive, opts)}
    <div class="message primary">
      <div class="spinner"></div>
      <div><strong>Searching the network for this ${label}. Please wait...</strong></div>
      <p>Try:</p>
      <ul>
        <li>Checking your connection</li>
        <li>Checking your firewall settings</li>
      </ul>
      <p>
        Having trouble? <a href="https://groups.google.com/forum/#!forum/beaker-browser" target="_blank">Ask for help</a> or <a href="https://github.com/beakerbrowser/beaker/issues" target="_blank">Report a bug</a>.
      </p>
    </div>
  </div>`
}

function renderArchive (archive, opts) {
  var view = (opts.selectedPath) ? renderFileView : renderArchiveDetails
  return yo`
    <div class="archive-view">
      ${renderFilesList(archive, opts)}
      ${view(archive, opts)}
    </div>
  `
}

function renderArchiveDetails (archive, opts) {
  // hide fileview and editor header
  Array.from(document.querySelectorAll('.fileview,.editor')).forEach(el => el.classList.remove('active'))

  return yo`<div>
    ${rHeader(archive, opts)}
    ${rMetadata(archive)}
    ${rToolbar(archive)}
    ${rBkrInstructions(archive)}
  </div>`
}

function rHeader (archive, opts) {
  if (archive.isEditingDetails) {
    return yo`
      <form class="archive-edit-details" onsubmit=${e => onSubmitEditDetails(e, archive)}>
        <p><input name="title" type="text" value=${archive.info.title || ''} placeholder="Title" tabindex="1" autofocus /> <button class="btn primary" type="submit" tabindex="3">Save</button></p>
        <p><input name="description" type="text" value=${archive.info.description || ''} placeholder="Description" tabindex="2" /></p>
      </form>
    `
  }

  return yo`
    <div>
      <div class="archive-view-header">
        <h2 class="title">
          <a href=${'dat://'+archive.info.key} title=${archive.niceName}>${archive.niceName}</a>
          ${rTitleIcon(archive)}
        </h2>
      </div>

      <p class="archive-desc">
        ${rDescription(archive)}
        ${rProvinence(archive)}
      </p>
    </div>
  `
}

function rDescription (archive) {
  return (archive.info.description)
    ? yo`<span>${archive.info.description}</span>`
    : yo`<em>no description</em>`
}

function rProvinence (archive) {
  var els = []

  if (archive.forkOf) {
    els.push(yo`
      <p>
        <i class="fa fa-code-fork"></i>
        <span>Fork of</span>
        <a href=${viewUrl(archive.forkOf)} onclick=${pushUrl}>${shortenHash(archive.forkOf)}</a>
      </p>`
    )
  }

  if (archive.createdBy) {
    els.push(yo`
      <p>
        <i class="fa fa-code"></i>
        <a href=${viewUrl(archive.info.createdBy.url)} onclick=${pushUrl}>
          Created by ${archive.info.createdBy.title || shortenHash(archive.info.createdBy.url)}
        </a>
      </p>`
    )
  }

  return els
}

function rMetadata (archive) {
  return yo`
    <div class="archive-metadata">
     <div class="history">
        <i class="fa fa-history"></i>
        Updated ${niceDate(archive.info.mtime)}
      </div>
      <div class="size">
        <i class="fa fa-info-circle"></i>
        <span>
          ${prettyBytes(archive.info.size)}
        </span>
      </div>
    </div>`
}

function rToolbar (archive) {
  return yo`
    <div class="archive-toolbar">
      <div class="btn-bar">
        ${rSaveBtn(archive)}

        <button class="btn" onclick=${() => onFork(archive)}>
          <i class="fa fa-code-fork"></i>
          <span>Fork</span>
        </button>

        <button class="btn" onclick=${writeToClipboard('dat://' + archive.info.key)}>
          <i class="fa fa-clipboard"></i>
          <span>Copy URL</span>
        </button>

        <a class="btn" href=${'dat://' + archive.info.key} target="_blank">
          <i class="fa fa-external-link"></i>
          <span>Open</span>
        </a>
      </div>
    </div>`
}

function rTitleIcon (archive) {
  if (archive.info.isOwner) {
    return yo`
      <i onclick=${() => onEditDetails(archive)} class="fa fa-pencil edit"></i>
    `
  }

  return yo`
    <i class="fa fa-eye"></i>
  `
}

function rSaveBtn (archive) {
  if (archive.isSaved) {
    return yo`
      <button class="btn" onclick=${() => archive.toggleSaved()}>
        <i class="fa fa-trash"></i>
        Remove from library
      </button>`
  }
  return yo`
    <button class="btn" onclick=${() => archive.toggleSaved()}>
      <i class="fa fa-save"></i>
      Save to library
    </button>`
}

function rBkrInstructions (archive) {
  return yo`
    <div class="archive-instructions protip">
      <p class="summary">
        <i class="fa fa-lightbulb-o"></i>
        Use <code><a href="https://github.com/beakerbrowser/bkr" target="_blank">bkr</a></code> to manage files from the command line.
      </p>

      <p class="content">
        Get started by cloning this archive:
        <pre><code>bkr clone ${archive.url}</code></pre>
      </p>
    </div>`
}

// event handlers
// =

async function onCreate () {
  var archive = await DatArchive.create()
  window.history.pushState(null, '', viewUrl(archive.url))
}

async function onFork (archive) {
  var newArchive = await DatArchive.fork(archive.url)
  window.location = 'beaker://editor/' + newArchive.url.slice('dat://'.length)
}

function onEditDetails (archive) {
  archive.isEditingDetails = true
  window.dispatchEvent(new Event('render'))
}

async function onSubmitEditDetails (e, archive) {
  e.preventDefault()
  e.stopPropagation()

  await beaker.archives.update(archive.url, {
    title: (e.target.title.value || '').trim(),
    description: (e.target.description.value || '').trim()
  })
  archive.isEditingDetails = false
  window.dispatchEvent(new Event('render'))  
}

// helpers
// =

function viewUrl (url) {
  if (url.startsWith('dat://')) {
    return 'beaker://editor/' + url.slice('dat://'.length)
  }
}
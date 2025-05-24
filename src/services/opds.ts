/**
 * OPDS 1.2 Client Implementation
 *
 * This module provides a browser-based client for interacting with OPDS 1.2 feeds.
 * It uses fetch API for HTTP requests and fast-xml-parser for XML parsing.
 */

import { XMLParser } from 'fast-xml-parser';
import Logger from 'js-logger';

const logger = Logger.get('opds')

interface ILink {
  href: string;
  rel: string;
  type: string;
}

interface IAuthor {
  name: string,
  uri?: string,
  email?: string
}

export interface IEntry {
  id: string;
  title: string;
  updated: string;
  link: ILink[];
  content: string;
}

export interface IContentEntry extends IEntry {
  author?: IAuthor[]
}

export interface IFeed<E extends IEntry = IEntry> {
  title: string;
  id: string;
  updated: string;
  link: ILink[];
  entry: E[];
}

export const FeedType = {
  Acquisition: 'application/atom+xml;profile=opds-catalog;kind=acquisition',
  Navigation: 'application/atom+xml;profile=opds-catalog;kind=navigation',
}

export const LinkRel = {
  Self: 'self',
  Start: 'start',
  Search: 'search',
  Up: 'up',
  Next: 'next',
  Collect: 'collect',
  Subsection: 'subsection',
  Thumbnail: 'http://opds-spec.org/image/thumbnail',
  Image: '​​http://opds-spec.org/image',
  Shelf: 'http://opds-spec.org/shelf',
  Facet: 'http://opds-spec.org/facet'
}

const resolveLinkHref = (href: string, baseUrl: string) => {
  if (href.startsWith('http://') || href.startsWith('https://')) return href
  return new URL(href, baseUrl).href
}

const getUrl = (links: ILink[], key: keyof ILink, valueOrValues: string | string[]) => {
  const values = Array.isArray(valueOrValues) ? valueOrValues : [valueOrValues]
  const link = links.find(item => values.includes(item[key]))
  return link?.href
}

export const getUrlByType = (links: ILink[], typeOrTypes: string | string[]) => getUrl(links, 'type', typeOrTypes)

export const getUrlByRel = (links: ILink[], relOrRels: string | string[]) => getUrl(links, 'rel', relOrRels)

const trimLinkType = (type: string) => type.replace(/;\s+/g, ';')

const normalizeLink = (links: ILink[], baseUrl: string) => links.map(item => ({
  ...item,
  type: trimLinkType(item.type),
  href: resolveLinkHref(item.href, baseUrl),
}))

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text",
  allowBooleanAttributes: true,
  parseAttributeValue: true,
  isArray(tagName) {
    return ['entry', 'author', 'link'].includes(tagName)
  },
});

const fetchXMLFeed = async <E extends IEntry = IEntry>(url: string) => {
  const r = await fetch(url);
  const xml = await r.text();

  const { feed } = parser.parse(xml);
  const { link, entry, ...rest } = feed as IFeed<E>;
  return {
    ...rest,
    link: normalizeLink(link, url),
    entry: entry.map(item => ({
      ...item,
      link: normalizeLink(item.link, url),
    }))
  }
}

export const fetchFeed = async <E extends IEntry = IEntry>(url: string): Promise<{
    type: string, url: string, feed: IFeed<E>
}> => {
  const feed = await fetchXMLFeed<E>(url);
  logger.info('getEntry', feed)
  const selfLink = Array.isArray(feed.link) ? feed.link.find(item => item.rel === LinkRel.Self) : feed.link
  return {
    feed,
    url,
    type: selfLink?.type || FeedType.Navigation
  }
}

export const getSearchUrl = async (searchDescUrl: string, options: { keyword: string }) => {
  const r = await fetch(searchDescUrl);
  const xml = await r.text();

  const result = parser.parse(xml);
  const template = result.OpenSearchDescription.Url.template
  const searchUrl = resolveLinkHref(template, searchDescUrl).replaceAll('{searchTerms}', encodeURIComponent(options.keyword))
  return searchUrl
}

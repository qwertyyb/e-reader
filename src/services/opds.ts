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
  link: ILink[] | ILink;
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
  Acquisition: 'application/atom+xml; profile=opds-catalog; kind=acquisition',
  Navigation: 'application/atom+xml; profile=opds-catalog; kind=navigation',
}

const LinkRel = {
  Self: 'self',
  Start: 'start',
  Search: 'search'
}

export class OPDSClient {
  private parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "text",
    allowBooleanAttributes: true,
    parseAttributeValue: true,
    isArray(tagName) {
      return ['entry', 'author'].includes(tagName)
    },
  });
  readonly rootUrl: string;
  constructor(rootUrl: string) {
    this.rootUrl = rootUrl;
  }

  async fetchXML<E extends IEntry = IEntry>(url: string) {
    const r = await fetch(url);
    const xml = await r.text();

    const { feed } = this.parser.parse(xml);
    return feed as IFeed<E>;
  }

  async getRootFeed() {
    const feed = await this.fetchXML(this.rootUrl);
    logger.info('getRootFeed', feed)
    const selfLink = Array.isArray(feed.link) ? feed.link.find(item => item.rel === LinkRel.Self) : feed.link
    return { feed, url: this.rootUrl, type: selfLink?.type || FeedType.Navigation }
  }

  resolveLHref(href: string, baseUrl: string ) {
    return new URL(href, baseUrl).href
  }

  async getEntryFeed<E extends IEntry = IEntry>(entry: IEntry, feedUrl: string): Promise<{
    type: string,
    url: string,
    feed: IFeed<E>
  }> {
    if (Array.isArray(entry.link)) {
      const msg = 'entry has multiple links, cant load entry'
      logger.error(msg, entry)
      throw new Error(msg)
    }

    if (![FeedType.Acquisition, FeedType.Navigation].includes(entry.link.type)) {
      throw new Error('entry link type is not supported')
    }

    const url = this.resolveLHref(entry.link.href, feedUrl)
    const feed = await this.fetchXML<E>(url);
    logger.info('getEntry', feed)
    return {
      feed,
      url,
      type: entry.link.type
    }
  }
}

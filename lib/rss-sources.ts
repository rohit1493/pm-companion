export type RSSSource = {
  url: string
  name: string
  topics: string[]
}

export const RSS_SOURCES: RSSSource[] = [
  {
    url: 'https://www.lennysnewsletter.com/feed',
    name: "Lenny's Newsletter",
    topics: ['PM Career', 'Product Strategy', 'Growth'],
  },
  {
    url: 'https://productcoalition.com/feed',
    name: 'Product Coalition',
    topics: ['PM Career', 'Product Strategy'],
  },
  {
    url: 'https://andrewchen.com/feed/',
    name: 'Andrew Chen',
    topics: ['Growth', 'Startups', 'B2B/SaaS'],
  },
  {
    url: 'https://www.producttalk.org/feed/',
    name: 'Product Talk',
    topics: ['PM Career', 'Product Strategy'],
  },
  {
    url: 'https://uxdesign.cc/feed',
    name: 'UX Collective',
    topics: ['Design & UX'],
  },
  {
    url: 'https://www.intercom.com/blog/feed',
    name: 'Intercom Blog',
    topics: ['B2B/SaaS', 'Product Strategy', 'Growth'],
  },
  {
    url: 'https://newsletter.herbig.co/feed',
    name: 'Product Management Insider',
    topics: ['PM Career', 'Product Strategy'],
  },
  {
    url: 'https://www.departmentofproduct.com/blog/feed/',
    name: 'Department of Product',
    topics: ['PM Career', 'Product Strategy', 'Analytics'],
  },
]

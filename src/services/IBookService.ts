interface IBook {
  id: string
  title: string
  cover: string
}

export interface IBookService {
  getBookList(): Promise<IBook[]>,
  getBook(id: string): Promise<IBook>,
  getChapterList(bookId: string): Promise<IChapter[]>,
  getChapterContent(bookId: string, chapter: IChapter): Promise<string>
}

export interface IBookServiceConstructor {
  new (): IBookService
}

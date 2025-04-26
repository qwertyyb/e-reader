interface IBook {
  id: string
  title: string
  cover: string
}

export interface IBookService {
  getBookList(): Promise<IBook[]>,
  getBook(id: string): Promise<IBook>,
  getChapterList(bookId: string): Promise<IChapter[]>,
  getChapter(bookId: string, chapterId: string, chapterIndex: number): Promise<string>
}

export interface IBookServiceConstructor {
  new (): IBookService
}

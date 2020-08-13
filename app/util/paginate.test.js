/**
 * MIT License

 *  Copyright (c) 2018 Aravind NC
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */

let mongoose = require("mongoose");
let paginate = require("./paginate");

let AuthorSchema = new mongoose.Schema({
    name: String,
});
let Author = mongoose.model("Author", AuthorSchema);

let BookSchema = new mongoose.Schema({
    title: String,
    date: Date,
    price: Number,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: "Author",
    },
    loc: Object,
});

BookSchema.index({
    loc: "2dsphere",
});

BookSchema.plugin(paginate);

let Book = mongoose.model("Book", BookSchema);

describe("mongoose-paginate", function () {
    beforeEach(function (done) {
        mongoose.connect(
            global.__MONGO_URI__,
            {
                useUnifiedTopology: true,
                useNewUrlParser: true,
            },
            done
        );
    });

    beforeEach(function (done) {
        mongoose.connection.db.dropDatabase(done);
    });

    beforeEach(function () {
        let book,
            books = [];
        let date = new Date();

        return Author.create({
            name: "Arthur Conan Doyle",
        }).then(function (author) {
            for (let i = 1; i <= 100; i++) {
                book = new Book({
                    // price: Math.floor(Math.random() * (1000 - 50) ) + 50,
                    price: i * 5 + i,
                    title: "Book #" + i,
                    date: new Date(date.getTime() + i),
                    author: author._id,
                    loc: {
                        type: "Point",
                        coordinates: [-10.97, 20.77],
                    },
                });
                books.push(book);
            }

            return Book.create(books);
        });
    });

    afterEach(function () {});

    it("promise return test", function () {
        let promise = Book.paginate();
        expect(promise.then).toBeInstanceOf(Function);
    });

    it("callback test", () => {
        return new Promise((resolve) => {
            Book.paginate({}, {}, function (err, result) {
                expect(err).toBeNull();
                expect(result).toBeInstanceOf(Object);
                resolve();
            });
        });
    });

    it("with page and limit", function () {
        var query = {
            title: {
                $in: [/Book/i],
            },
        };

        var options = {
            limit: 10,
            page: 5,
            lean: true,
        };

        return Book.paginate(query, options).then((result) => {
            expect(result.docs.length).toBe(10);
            expect(result.totalDocs).toEqual(100);
            expect(result.limit).toEqual(10);
            expect(result.page).toEqual(5);
            expect(result.pagingCounter).toEqual(41);
            expect(result.hasPrevPage).toEqual(true);
            expect(result.hasNextPage).toEqual(true);
            expect(result.prevPage).toEqual(4);
            expect(result.nextPage).toEqual(6);
            expect(result.totalPages).toEqual(10);
        });
    });

    it("first page with page and limit", function () {
        var query = {
            title: {
                $in: [/Book/i],
            },
        };

        var options = {
            limit: 10,
            page: 1,
            lean: true,
        };

        return Book.paginate(query, options).then((result) => {
            expect(result.docs.length).toBe(10);
            expect(result.totalDocs).toEqual(100);
            expect(result.limit).toEqual(10);
            expect(result.page).toEqual(1);
            expect(result.pagingCounter).toEqual(1);
            expect(result.hasPrevPage).toEqual(false);
            expect(result.hasNextPage).toEqual(true);
            expect(result.prevPage).toEqual(null);
            expect(result.nextPage).toEqual(2);
            expect(result.totalPages).toEqual(10);
        });
    });

    it("last page with page and limit", function () {
        var query = {
            title: {
                $in: [/Book/i],
            },
        };

        var options = {
            limit: 10,
            page: 10,
            lean: true,
        };

        return Book.paginate(query, options).then((result) => {
            expect(result.docs.length).toBe(10);
            expect(result.totalDocs).toEqual(100);
            expect(result.limit).toEqual(10);
            expect(result.page).toEqual(10);
            expect(result.pagingCounter).toEqual(91);
            expect(result.hasPrevPage).toEqual(true);
            expect(result.hasNextPage).toEqual(false);
            expect(result.prevPage).toEqual(9);
            expect(result.nextPage).toEqual(null);
            expect(result.totalPages).toEqual(10);
        });
    });

    it("with offset and limit (not page)", function () {
        var query = {
            title: {
                $in: [/Book/i],
            },
        };

        var options = {
            limit: 10,
            offset: 98,
            sort: {
                _id: 1,
            },
            lean: true,
        };

        return Book.paginate(query, options).then((result) => {
            expect(result.docs.length).toBe(2);
            expect(result.totalDocs).toEqual(100);
            expect(result.limit).toEqual(10);
            expect(result.page).toEqual(10);
            expect(result.pagingCounter).toEqual(91);
            expect(result.hasPrevPage).toEqual(true);
            expect(result.hasNextPage).toEqual(false);
            expect(result.prevPage).toEqual(9);
            expect(result.nextPage).toEqual(null);
            expect(result.totalPages).toEqual(10);
        });
    });

    it("with offset and limit (not page) condition: offset > 0 < limit", function () {
        var query = {
            title: {
                $in: [/Book/i],
            },
        };

        var options = {
            limit: 10,
            offset: 5,
            sort: {
                _id: 1,
            },
            lean: true,
        };

        return Book.paginate(query, options).then((result) => {
            expect(result.docs.length).toBe(10);
            expect(result.totalDocs).toEqual(100);
            expect(result.limit).toEqual(10);
            expect(result.page).toEqual(1);
            expect(result.pagingCounter).toEqual(1);
            expect(result.hasPrevPage).toEqual(true);
            expect(result.hasNextPage).toEqual(true);
            expect(result.prevPage).toEqual(1);
            expect(result.nextPage).toEqual(2);
            expect(result.totalPages).toEqual(10);
        });
    });

    it("with limit=0 (metadata only)", function () {
        var query = {
            title: {
                $in: [/Book #1/i],
            },
        };

        var options = {
            limit: 0,
            sort: {
                _id: 1,
            },
            collation: {
                locale: "en",
                strength: 2,
            },
            lean: true,
        };

        return Book.paginate(query, options).then((result) => {
            expect(result.docs.length).toBe(0);
            expect(result.totalDocs).toEqual(12);
            expect(result.limit).toEqual(0);
            expect(result.page).toEqual(null);
            expect(result.pagingCounter).toEqual(null);
            expect(result.hasPrevPage).toEqual(false);
            expect(result.hasNextPage).toEqual(false);
            expect(result.prevPage).toEqual(null);
            expect(result.nextPage).toEqual(null);
            expect(result.totalPages).toEqual(null);
        });
    });

    it.skip("with $where condition", function () {
        var query = {
            $where: "this.price < 100",
        };

        var options = {
            sort: {
                price: -1,
            },
            page: 2,
        };

        return Book.paginate(query, options).then((result) => {
            expect(result.docs.length).toBe(6);
            expect(result.docs[0].title).toEqual("Book #6");
            expect(result.totalDocs).toEqual(16);
            expect(result.limit).toEqual(10);
            expect(result.page).toEqual(2);
            expect(result.pagingCounter).toEqual(11);
            expect(result.hasPrevPage).toEqual(true);
            expect(result.hasNextPage).toEqual(false);
            expect(result.prevPage).toEqual(1);
            expect(result.nextPage).toEqual(null);
            expect(result.totalPages).toEqual(2);
        });
    });

    it("with empty custom labels", function () {
        var query = {
            title: {
                $in: [/Book/i],
            },
        };

        const myCustomLabels = {
            nextPage: false,
            prevPage: "",
        };

        var options = {
            sort: {
                _id: 1,
            },
            limit: 10,
            page: 5,
            select: {
                title: 1,
                price: 1,
            },
            customLabels: myCustomLabels,
        };
        return Book.paginate(query, options).then((result) => {
            expect(result.docs.length).toBe(10);
            expect(result.docs[0].title).toEqual("Book #41");
            expect(result.totalDocs).toEqual(100);
            expect(result.limit).toEqual(10);
            expect(result.page).toEqual(5);
            expect(result.pagingCounter).toEqual(41);
            expect(result.hasPrevPage).toEqual(true);
            expect(result.hasNextPage).toEqual(true);
            expect(result.totalPages).toEqual(10);
            expect(result.prevPage).toEqual(undefined);
            expect(result.nextPage).toEqual(undefined);
        });
    });

    it("with custom labels", function () {
        var query = {
            title: {
                $in: [/Book/i],
            },
        };

        const myCustomLabels = {
            totalDocs: "itemCount",
            docs: "itemsList",
            limit: "perPage",
            page: "currentPage",
            nextPage: "next",
            prevPage: "prev",
            totalPages: "pageCount",
            pagingCounter: "pageCounter",
            hasPrevPage: "hasPrevious",
            hasNextPage: "hasNext",
        };

        var options = {
            sort: {
                _id: 1,
            },
            limit: 10,
            page: 5,
            select: {
                title: 1,
                price: 1,
            },
            customLabels: myCustomLabels,
        };
        return Book.paginate(query, options).then((result) => {
            expect(result.itemsList.length).toBe(10);
            expect(result.itemsList[0].title).toEqual("Book #41");
            expect(result.itemCount).toEqual(100);
            expect(result.perPage).toEqual(10);
            expect(result.currentPage).toEqual(5);
            expect(result.pageCounter).toEqual(41);
            expect(result.hasPrevious).toEqual(true);
            expect(result.hasNext).toEqual(true);
            expect(result.prev).toEqual(4);
            expect(result.next).toEqual(6);
            expect(result.pageCount).toEqual(10);
        });
    });

    it("with custom Meta label", function () {
        var query = {
            title: {
                $in: [/Book/i],
            },
        };

        const myCustomLabels = {
            meta: "meta",
            docs: "itemsList",
            totalDocs: "total",
        };

        var options = {
            sort: {
                _id: 1,
            },
            limit: 10,
            page: 5,
            select: {
                title: 1,
                price: 1,
            },
            customLabels: myCustomLabels,
        };
        return Book.paginate(query, options).then((result) => {
            expect(result.itemsList.length).toBe(10);
            expect(result.itemsList[0].title).toEqual("Book #41");
            expect(result.meta).toBeInstanceOf(Object);
            expect(result.meta.total).toEqual(100);
        });
    });

    it("all data (without pagination)", function () {
        var query = {
            title: {
                $in: [/Book/i],
            },
        };

        var options = {
            pagination: false,
        };

        return Book.paginate(query, options).then((result) => {
            expect(result.docs.length).toBe(100);
            expect(result.totalDocs).toEqual(100);
            expect(result.limit).toEqual(100);
            expect(result.page).toEqual(1);
            expect(result.pagingCounter).toEqual(1);
            expect(result.hasPrevPage).toEqual(false);
            expect(result.hasNextPage).toEqual(false);
            expect(result.prevPage).toEqual(null);
            expect(result.nextPage).toEqual(null);
            expect(result.totalPages).toEqual(1);
        });
    });

    afterEach(async () => {
        await mongoose.connection.db.dropDatabase();
        await mongoose.disconnect();
    });
});

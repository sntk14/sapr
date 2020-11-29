class SyncAnalizer {
    constructor(lexTable, identTable, debug) {
        this.lexTable = lexTable
        this.identTable
        this.row = 0
        this.level = 0
        this.postfixCode = []
        this.labels = []
        this.isBracket = 0//таблиця ПОЛІЗу
        this.isViewPOLIZSteps = debug
        this.POLIZStep = 1
        this.isSetPostfixCode = 1
    }

    getInPOLIZWrire(el) {
        // if(el.lexeme != 'int' && el.lexeme != 'float')
        return el.lexeme
    }

    getLabels() {
        return this.labels
    }

    setPostfixCode(lexeme) {
        // if (this.isSetPostfixCode) {
        this.postfixCode.push(lexeme)
        if (this.isViewPOLIZSteps) {
            console.log(`Крок трансляцiї:${this.POLIZStep} \n Лексема: ${this.getInPOLIZWrire(lexeme)} \n postfixCode: [${this.postfixCode.map(el => this.getInPOLIZWrire(el))}] \n`)
            if (lexeme != 'int' && lexeme != 'float') this.POLIZStep++
        }
        // }
    }

    createLabel() {
        //return size of array, which is a number of label
        let len = this.labels.length
        let val = this.postfixCode.length
        this.labels.push({label: `m${len}`, value: val})
        return `m${len}`
    }

    setLabelValue(label){
        //indicate on tail
        this.labels = this.labels.map(l => {
            if(l.label === label) l.value = this.postfixCode.length
            return l
        })
    }

    parseProgram() {
        try {
            this.parseToken('main', 'keyword')
            this.parseToken('{', 'brackets_op')
            this.parseStatementList()
            this.parseToken('}', 'brackets_op')
            if (this.isViewPOLIZSteps) console.log(this.postfixCode)
            console.log('Успішне завершення синтаксичного аналізатора!')
        } catch (e) {
            this.failParse(e);
            throw 'Синтаксичний аналізатор аварійно завершив роботу!'
        }
    }

    parseToken(lexeme, token, ident) {
        if (this.row > (this.lexTable.length - 1)) throw `Помилка: очікували ${lexeme} [${token}]` //this.failParse(lexeme, token,this.row)

        let lexRow = this.getSymb()
        //this.logger()
        if (lexRow.token == token && lexRow.lexeme == lexeme) {
            this.addRow()
            return true
        } else {
            throw `Hевідповідність токенів, маємо ${lexRow.lexeme}[${lexRow.token}] у рядку ${lexRow.row}`;// , а очікували: ${lexeme}[${token}]
        }
    }

    getSymb(row = false) {
        if (this.row > (this.lexTable.length - 1)) {
            let lex = this.lexTable[this.row - 1]
            throw `Помилка взяття символа після ${lex.lexeme} у рядку [${lex.row}]`
        } //this.failParse(lexeme, token,this.row)

        if (row) return this.lexTable[row]

        return this.lexTable[this.row]
    }

    failParse(e) {
        console.log(e)
        if (this.row < (this.lexTable.length - 1)) {
            // console.log(`ROW: ${this.row} LENGHT: ${this.lexTable.length}`)
            let lexRow = this.getSymb(this.row)
            //	console.log(`Помилка: у ${lexRow.row} рядку неочікуваний символ ${lexRow.lexeme}`)
        }
    }

    addRow() {
        this.row++
    }

    addLevel() {
        this.level++
    }

    subLevel() {
        this.level--
    }

    parseStatementList() {
        while (this.parseStatement()) {
            true//this.addRow()
        }
    }


    parseStatement() {
        let lexRow = this.getSymb()

        if (this.checkLexToken(lexRow, {lexeme: 'if', token: 'keyword'})) {
            this.parseIf()
            return true
        }

        if (this.checkLexToken(lexRow, {lexeme: 'for', token: 'keyword'})) {
            this.parseFor()
            return true
        }

        if (this.checkLexToken(lexRow, {lexeme: 'int', token: 'keyword'}) ||
            this.checkLexToken(lexRow, {lexeme: 'float', token: 'keyword'}) ||
            this.checkLexToken(lexRow, {lexeme: 'bool', token: 'keyword'})) {

            this.parseAssign()
            this.addRow()
            return true
        }
        if (lexRow.token == 'ident') {
            this.parseAssign()

            this.addRow()
            return true
        }
        if (lexRow.token == 'nl') {
            this.addRow()
            return true
        }
        if (this.checkLexToken(lexRow, {lexeme: 'echo', token: 'keyword'}) ||
            this.checkLexToken(lexRow, {lexeme: 'read', token: 'keyword'})) {

            this.parseFunction()
            this.addRow()

            return true
        }


        return false
    }


    checkLexToken(lexRow, {lexeme, token}) {
        if (lexRow.token == token && lexRow.lexeme == lexeme) return true

        return false
    }


    parseAssign() {
        let lexRow = this.getSymb()
        if (lexRow.lexeme == 'int' || lexRow.lexeme == 'float') {//чисельные значения присвоение
            this.setPostfixCode(lexRow)
            this.logger('ExpAssign Statement')
            this.addRow()
            lexRow = this.getSymb()
            if (!this.getSymb().token == 'ident') throw `У рядку ${this.getSymb().row} має бути змінна`
            this.addRow()
            this.parseToken('=', 'assign_op')
            this.setPostfixCode(lexRow)
            this.parseExpression()
            this.setPostfixCode({lexeme: '='})
        } else if (lexRow.lexeme == 'bool') {//логические значения присвоение
            this.setPostfixCode(lexRow)
            this.logger('BoolAssign Statement')
            this.addRow()
            lexRow = this.getSymb()
            if (!this.getSymb().token == 'ident') throw `У рядку ${this.getSymb().row} має бути змінна`
            this.addRow()
            this.parseToken('=', 'assign_op')
            this.setPostfixCode(lexRow)
            this.parseBoolExpr()
            this.setPostfixCode({lexeme: '='})
        } else if (lexRow.token == 'ident') {//переприсвоние
            this.logger('ReAssign Statement')
            this.addRow()
            this.parseToken('=', 'assign_op')
            this.setPostfixCode(lexRow)
            this.parseBoolExpr(1)
            this.setPostfixCode({lexeme: '='})
        } else {
            return false
        }
        return true
    }
    parseBoolExpr(ext = 0) {
        let lexRow = this.getSymb()
        // this.parseTemp()
        if (lexRow.lexeme == 'false' || lexRow.lexeme == 'true') {
            this.addRow()
            this.setPostfixCode(lexRow)
            return true
        }

        this.parseExpression()
        lexRow = this.getSymb()
        if (lexRow.token === 'rel_op') {
            this.addRow()
            this.parseExpression()
            this.setPostfixCode(lexRow)
        } else {
            if(ext) {
                return true
            } else {
                throw 'Помилка логічного виразу'
            }
        }
        return true
    }

    parseExpression() {
        let lexRow = this.getSymb()
        this.parseFactor()
        let F = true
        while (F) {
            lexRow = this.getSymb()
            if (['add_op'].includes(lexRow.token)) {
                this.addRow()
                this.parseFactor()
                this.setPostfixCode(lexRow)
            } else {
                F = false
            }
        }
        return true
    }

    parseFactor() {
        let lexRow = this.getSymb()
        this.parseFactor1()
        let F = true
        while (F) {
            lexRow = this.getSymb()
            if (['mult_op'].includes(lexRow.token)) {
                this.addRow()
                this.parseFactor1()
                this.setPostfixCode(lexRow)
            } else {
                F = false
            }
        }
        return true
    }


    parseFactor1() {
        let lexRow = this.getSymb()
        this.parseTemp()
        let F = true
        while (F) {
            lexRow = this.getSymb()
            if (['degr_op'].includes(lexRow.token)) {
                this.addRow()
                this.parseTemp()
                this.setPostfixCode(lexRow)
            } else {
                F = false
            }
        }
        return true
    }


    parseTemp() {
        let lexRow = this.getSymb()

        if (['int', 'float', 'ident'].includes(lexRow.token)) {
            this.addRow()
        } else if (lexRow.lexeme == '(') {
            this.isBracket++
            this.addRow()
            this.parseExpression()
            this.parseToken(')', 'brackets_op')

            this.isBracket--
        } else {
            throw 'невідповідність у Expression.Factor'
        }

        if (lexRow.lexeme != '(') {
            this.setPostfixCode(lexRow)
        }
        return true
    }


    parseFor() {
        let lexRow = this.getSymb()
        if (lexRow.lexeme == 'for') {
            this.logger('For Statement')
            this.addRow()
            this.parseAssign()
            this.parseToken('to', 'keyword')
            this.isSetPostfixCode = 0//не добавлять в полиз
            this.parseExpression()
            this.parseToken('step', 'keyword')
            this.parseExpression()
            this.isSetPostfixCode = 1//добавлять)
            this.parseToken('do', 'keyword')
            this.logger('Statement List:')
            this.addLevel()
            this.parseStatementList()
            this.subLevel()
            this.parseToken('next', 'keyword')
        }
    }


    parseFunction() {
        let lexRow = this.getSymb()
        if (lexRow.lexeme == 'echo' || lexRow.lexeme == 'read') {
            this.logger('Read/Echo Statement')
            this.addRow()
            this.parseToken('(', 'brackets_op')

            // let labNam = this.createLabel()
            // this.setPostfixCode({lexeme: labNam, token: 'label'})
            // this.setPostfixCode({lexeme: 'JMP', token: 'jump'})
            // this.setLabelValue(labNam)

            do {
                this.parseExpression();
                if (this.getSymb().token !== 'coma') break
                this.addRow()
            } while (true)
            this.setPostfixCode(lexRow)//end func
            this.parseToken(')', 'brackets_op')
        }
    }

    parseIf() {
        let lexRow = this.getSymb()
        if (lexRow.lexeme == 'if') {
            this.logger('If Statement')
            this.addRow()
            this.isSetPostfixCode = 0
            this.parseBoolExpr()
            this.isSetPostfixCode = 1
            this.parseToken('then', 'keyword')

            let labNam1 = this.createLabel()
            this.setPostfixCode({lexeme: labNam1, token: 'label'})
            this.setPostfixCode({lexeme: 'JF', token: 'jf'})
            this.logger('Statement List:')
            this.addLevel()
            this.parseStatementList()
            this.subLevel()
            this.parseToken('else', 'keyword')
            let labNam2 = this.createLabel()
            this.setPostfixCode({lexeme: labNam2, token: 'label'})
            this.setPostfixCode({lexeme: 'JMP', token: 'jump'})
            this.setLabelValue(labNam1)
            this.setPostfixCode({lexeme: labNam1, token: 'label'})

            this.logger('Statement List:')
            this.addLevel()
            this.parseStatementList()
            this.subLevel()
            this.parseToken('endif', 'keyword')

            this.setLabelValue(labNam2)
            this.setPostfixCode({lexeme: labNam2, token: 'label'})

            return true
        }
        return false

    }




    getPostfixCode() {
        return this.postfixCode
    }

    logger(statement) {
        let tabs = ''

        for (let i = 0; i < this.level; i++) {
            tabs += '\t'
        }

        if (this.isViewPOLIZSteps) console.log(`${tabs} ${statement}`)
    }
}
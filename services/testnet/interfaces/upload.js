module.exports = {
    face: async (ctx, next) => {
        let fileObj = Object.entries(ctx.data).reduce((pre, [key, value]) => {
            pre.push({
                key,
                name: value[0].name,
                path: value[0].path&&value[0].path.replace(/\\/g,'\/')
            })
            return pre
        }, [])
        return {
            code: 0,
            message: '上传成功',
            fileObj

        }
    }
}
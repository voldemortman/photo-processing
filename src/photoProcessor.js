import React from 'react'

class PhotoProcessor extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            imageSrc: null
        }
    }

    copyValuesToArray = (target, source) => {
        for (let i = 0; i < source.length; i++) {
            target[i] = source[i]
        }
    }

    onImageChange = ({target}) => {
        if (target.files && target.files[0]) {
            this.setState({
                imageSrc: URL.createObjectURL(target.files[0])
            })
        }
    }

    convertImageDataToMatrix = (imageData, height, width) => {
        let ImageDataMatrix = []
        for (let i = 0; i < height; i++) {
            ImageDataMatrix.push([])
            for (let j = 0; j < width; j++) {
                let x = i * (width * 4) + j * 4
                ImageDataMatrix[i].push([imageData[x], imageData[x + 1], imageData[x + 2], imageData[x + 3]])
            }
        }
        return ImageDataMatrix
    }

    convertMatrixToImageData = (imageDataMatrix) => {
        let imageData = []
        for (let i = 0; i < imageDataMatrix.length; i++) {
            for (let j = 0; j < imageDataMatrix[i].length; j++) {
                imageData.push(imageDataMatrix[i][j][0])
                imageData.push(imageDataMatrix[i][j][1])
                imageData.push(imageDataMatrix[i][j][2])
                imageData.push(imageDataMatrix[i][j][3])
            }
        }
        return imageData
    }

    processImageAndDraw = (imageObject) => {
        let canvas = document.createElement("canvas")
        let ctx = canvas.getContext('2d')
        canvas.width = imageObject.width
        canvas.height = imageObject.height
        ctx.drawImage(imageObject, 0, 0)
        let imageData = ctx.getImageData(0, 0, imageObject.width, imageObject.height)
        let imageDataMatrix = this.convertImageDataToMatrix(imageData.data, imageObject.height, imageObject.width)
        this.calculateGrayScale(imageDataMatrix)
        this.gaussianBlur(imageDataMatrix, 5.5, 9)
        // console.log(imageDataMatrix)
        setTimeout(() => {
            this.copyValuesToArray(imageData.data, this.convertMatrixToImageData(imageDataMatrix))
            ctx.putImageData(imageData, 0, 0)
            this.setState({
                imageSrc: canvas.toDataURL()
            })
        }, 1000)
    }

    calculateGrayScale = (imageDataMatrix) => {
        for (let i = 0; i <imageDataMatrix.length; i++) {
            for (let j = 0; j < imageDataMatrix[i].length; j++){
                let luminosity = 0.21 * imageDataMatrix[i][j][0] + 0.72 * imageDataMatrix[i][j][1] + 0.07 * imageDataMatrix[i][j][2]
                imageDataMatrix[i][j][0] = luminosity
                imageDataMatrix[i][j][1] = luminosity
                imageDataMatrix[i][j][2] = luminosity
            }
        }
    }

    blurImage = (imageDataMatrix, blurConst) => {
        for (let i = 0; i < imageDataMatrix.length; i += blurConst) {
            for (let j = 0; j < imageDataMatrix[i].length; j += blurConst) {
                let xEnd = Math.min(j + blurConst, imageDataMatrix[i].length)
                let yEnd = Math.min(i + blurConst, imageDataMatrix.length)
                let sum = 0
                for (let y = i; y < yEnd; y++) {
                    for (let x = j; x < xEnd; x++) {
                        sum += imageDataMatrix[y][x][0]
                    }
                }
                let avg = sum / ((xEnd - j) * (yEnd - i))
                for (let y = i; y < yEnd; y++) {
                    for (let x = j; x < xEnd; x++) {
                        imageDataMatrix[y][x][0] = avg
                        imageDataMatrix[y][x][1] = avg
                        imageDataMatrix[y][x][2] = avg
                    }
                }
            }
        }
    }

    gaussianFunction = sigma => (x, y) => {
        let exponent = - (((x * x) + (y * y))/ (2 * (sigma * sigma)))
        let rightHandSide = Math.E ** exponent
        let leftHandSide = 1 / (2 * Math.PI * sigma * sigma)
        return rightHandSide * leftHandSide
    }

    calculateGaussianFilter = (sigma, filterSize) => {
        let gaussianBlurForSigma = this.gaussianFunction(sigma)
        let middle = Math.floor(filterSize/2)
        let filter = []
        for (let i = 0; i < filterSize; i++) {
            filter.push([])
            for (let j = 0; j < filterSize; j++) {
                let xDistanceFromMiddle = middle - j
                let yDistanceFromMiddle = middle - i
                let gaussianBlurValue = gaussianBlurForSigma(xDistanceFromMiddle, yDistanceFromMiddle)
                filter[i].push(gaussianBlurValue)
            }
        }
        return filter
    }

    gaussianBlur = (imageDataMatrix, sigma, filterSize) => {
        const filter = this.calculateGaussianFilter(sigma, filterSize)
        let imageDataCopy = []
        for (let i = 0; i < imageDataMatrix.length; i++) {
            imageDataCopy.push([])
            for (let j = 0; j < imageDataMatrix[i].length; j++) {
                let xStart = Math.max(0, j - Math.floor(filterSize / 2))
                let yStart = Math.max(0, i - Math.floor(filterSize / 2))
                let xEnd = Math.min(imageDataMatrix[i].length, j + Math.floor(filterSize / 2))
                let yEnd = Math.min(imageDataMatrix.length, i + Math.floor(filterSize / 2))
                // let pixelValue = this.calculateGaussianBlurOnPixel(filter, imageDataMatrix, xStart, xEnd, yStart, yEnd)
                let pixel = [255, 0, 0, 0]
                imageDataCopy[i].push(pixel)
            }
        }
        console.log(imageDataCopy)
        this.copyValuesToArray(imageDataMatrix, imageDataCopy)
        console.log(imageDataMatrix)
    }

    calculateGaussianBlurOnPixel = (filter, matrix, xStart, xEnd, yStart, yEnd) => {
        let sum = 0
        let filterSum = 0
        for (let i = yStart; i < yEnd; i++) {
            for (let j = xStart; j < xEnd; j++) {
                sum += filter[i - yStart][j - xStart] * matrix[i][j][0]
                filterSum += filter[i - yStart][j - xStart]
            }
        }
        return sum / filterSum
    }

    render = () => {
        return (
            <div>
                <input type="file" onChange={this.onImageChange}/>
                <img id="chiko" alt="alt" src={this.state.imageSrc} onClick={(event) => {this.processImageAndDraw(event.target)}}/>
            </div>
        )
    }
}

export default PhotoProcessor
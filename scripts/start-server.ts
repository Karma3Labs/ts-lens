import serve from '../server/index'
import Recommender from '../recommender/index'

const recommender = new Recommender()
serve(recommender)
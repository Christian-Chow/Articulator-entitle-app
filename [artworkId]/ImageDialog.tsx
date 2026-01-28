"use client"

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
} from '@/src/components/ui/dialog'
import Image from 'next/image'
import { cn } from '@/src/lib/utils'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'
import type SwiperType from 'swiper'
import { Pagination } from 'swiper/modules'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageDialogProps {
    urls: string[]
    alt?: string
}

/**
 * ImageDialog Component
 * 
 * A clickable image slider that opens a full-size view in a dialog modal when clicked.
 * Based on ImageSlider but with click-to-expand functionality.
 * 
 * @param {ImageDialogProps} props - Component props
 * @returns {JSX.Element} The rendered clickable image slider with dialog
 */
export default function ImageDialog({ urls, alt = 'Artwork image' }: ImageDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [swiper, setSwiper] = useState<null | SwiperType>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [slideConfig, setSlideConfig] = useState({
        isBeginning: true,
        isEnd: activeIndex === (urls.length ?? 0) - 1,
    })

    useEffect(() => {
        swiper?.on('slideChange', ({ activeIndex }) => {
            setActiveIndex(activeIndex)
            setSelectedImageIndex(activeIndex)
            setSlideConfig({
                isBeginning: activeIndex === 0,
                isEnd: activeIndex === (urls.length ?? 0) - 1,
            })
        })
    }, [swiper, urls])

    const handleImageClick = (e: React.MouseEvent) => {
        // Don't open dialog if clicking on navigation buttons or pagination
        const target = e.target as HTMLElement
        if (
            target.closest('button') ||
            target.closest('.swiper-pagination') ||
            target.tagName === 'BUTTON'
        ) {
            return
        }
        setIsOpen(true)
    }

    const activeStyles =
        'active:scale-[0.97] grid opacity-100 hover:scale-105 absolute top-1/2 -translate-y-1/2 aspect-square h-8 w-8 place-items-center rounded-full border-2 bg-white border-zinc-300 z-10'
    const inactiveStyles = 'hidden text-gray-400'

    return (
        <>
            <div 
                className="relative overflow-hidden group bg-zinc-100 aspect-square cursor-pointer"
                onClick={handleImageClick}
            >
                {/* Navigation buttons container - visible only on hover */}
                <div className='absolute inset-0 transition opacity-0 group-hover:opacity-100 z-20 pointer-events-none'>
                    {/* Next slide button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            swiper?.slideNext()
                        }}
                        className={cn(
                            activeStyles,
                            'right-3 transition pointer-events-auto',
                            {
                                [inactiveStyles]: slideConfig.isEnd,
                                'hover:bg-primary-300 text-primary-800 opacity-100':
                                    !slideConfig.isEnd,
                            }
                        )}
                        aria-label='next image'>
                        <ChevronRight className='w-4 h-4 text-zinc-700' />
                    </button>
                    
                    {/* Previous slide button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            swiper?.slidePrev()
                        }}
                        className={cn(activeStyles, 'left-3 transition pointer-events-auto', {
                            [inactiveStyles]: slideConfig.isBeginning,
                            'hover:bg-primary-300 text-primary-800 opacity-100':
                                !slideConfig.isBeginning,
                        })}
                        aria-label='previous image'>
                        <ChevronLeft className='w-4 h-4 text-zinc-700' />
                    </button>
                </div>

                {/* Swiper component configuration */}
                <Swiper
                    pagination={{
                        renderBullet: (_, className) => {
                            return `<span class="rounded-full transition ${className}"></span>`
                        },
                    }}
                    onSwiper={(swiper) => setSwiper(swiper)}
                    spaceBetween={50}
                    modules={[Pagination]}
                    slidesPerView={1}
                    className='w-full h-full cursor-pointer'
                    onClick={(swiper, event) => {
                        // Handle click on swiper - open dialog if not clicking buttons or pagination
                        const target = event.target as HTMLElement
                        if (
                            !target.closest('button') &&
                            !target.closest('.swiper-pagination') &&
                            target.tagName !== 'BUTTON' &&
                            !target.closest('svg') // Don't trigger on icon clicks
                        ) {
                            setIsOpen(true)
                        }
                    }}
                >
                    {/* Map through image URLs and create slides */}
                    {urls.map((url, i) => (
                        <SwiperSlide
                            key={i}
                            className='relative w-full h-full'
                        >
                            <Image
                                fill
                                loading='eager'
                                className='object-cover object-center w-full h-full'
                                src={url}
                                alt={alt}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent 
                    className={cn(
                        "max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 m-0 overflow-hidden",
                        "bg-black/95 border-none"
                    )}
                >
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <Image
                            src={urls[selectedImageIndex]}
                            alt={alt}
                            width={1200}
                            height={1200}
                            className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                            quality={100}
                            priority
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}


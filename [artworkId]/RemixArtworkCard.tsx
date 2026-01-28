/**
 * RemixArtworkCard Component
 * 
 * A client-side component that provides AI-powered artwork restyling functionality.
 * Users can select from various artistic styles and adjust creativity parameters
 * to generate new derivative works based on the original artwork. The component
 * uses server actions to process the restyling requests and provides real-time
 * feedback to users during the generation process.
 */
'use client';

import * as z from "zod";
import Image from 'next/image'
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { artworkRestyler } from "@/src/schemas";
import { startTransition, useState } from 'react'
import { Label } from "@/src/components/ui/label"
import { Slider } from "@/src/components/ui/slider"
import { Button } from "@/src/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/src/components/ui/card"
import { GradientHeading } from '@/src/components/ui/gradient-heading';
import { TextureCardHeader } from '@/src/components/cult-ui/texture-card';
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group"
import { restyleArtworkAction } from "@/src/actions/artworks/imageRestyler";
import { STYLES_SAI } from "@/src/constants/artStyles";
import { Badge } from "@/src/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion";
import { useTranslations } from 'next-intl';

/**
 * Props for the RemixArtworkCard component
 * @property {string} artworkId - The unique identifier of the artwork to be restyled
 */
interface RemixArtworkCardProps {
  artworkId: string;
}

/**
 * RemixArtworkCard Component
 * 
 * Renders an expandable card interface that allows users to restyle an existing artwork
 * using AI. Users can select different artistic styles and adjust creativity parameters
 * before generating a new derivative work.
 * 
 * @param {RemixArtworkCardProps} props - Component props
 * @returns {JSX.Element} The rendered remix artwork card
 */
export default function RemixArtworkCard({ artworkId }: RemixArtworkCardProps) {
  const t = useTranslations();
  const router = useRouter();

  // State management for component
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>('sai-3d-model')
  const [creativity, setCreativity] = useState<number>(50);
  const [type, setType] = useState<string>('Ordinary');
  // State for intensity control (currently disabled)
  // const [intensity, setIntensity] = useState<number>(50)
  const [remixedImage, setRemixedImage] = useState<string | null>(null)

  /**
   * Handles image upload from file input
   * Currently not actively used in the UI but kept for future enhancements
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setUploadedImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Initialize form using react-hook-form with Zod validation
  const form = useForm<z.infer<typeof artworkRestyler>>({
    resolver: zodResolver(artworkRestyler),
    defaultValues: {
      styleName: selectedStyle,
      type: "Ordinary",
      artworkId,
      creativity: 50
    },
  });

  /**
   * Handles local preview of remix functionality
   * Currently shows a placeholder image after a delay
   * This is a UI demonstration feature, actual generation happens in onSubmit
   */
  const handleRemix = () => {
    // Simulate image processing
    setTimeout(() => {
      setRemixedImage('/placeholder.svg?height=300&width=300')
    }, 2000)
  }

  /**
   * Submits the restyling request to the server
   * Uses React startTransition to avoid blocking the UI during processing
   * Displays toast notifications to provide feedback on the generation progress
   * 
   * @param {z.infer<typeof artworkRestyler>} values - Form values from the submit event
   */
  const onSubmit = async (values: z.infer<typeof artworkRestyler>) => {

    startTransition(() => {
      try {
        const promise = restyleArtworkAction({ ...values, artworkId, creativity });

        toast.promise(
          // @ts-ignore
          promise,
          {
            pending: {
              render() {
                return t('artworkDetail.generating')
              },
            },
            success: t('artworkDetail.success'),
            error: t('artworkDetail.somethingWentWrong'),
          },
          {
            autoClose: 3000,
            progress: undefined,
            theme: "light",
          }
        ).then((response) => {
          router.refresh();
        })

      } catch (error) {
        toast.error("Something went wrong :(", {
          autoClose: 7000,
          progress: undefined,
          theme: "colored",
        });
      }
    })
  }

  return (
    <Accordion type="single" collapsible className="px-4 mx-auto w-full px-10" defaultValue="remix-art-generator">
      {/* Collapsible accordion for the remix functionality */}
      <AccordionItem value="remix-art-generator">
        <AccordionTrigger className='px-1'>{t('artworkDetail.restyleArtwork')}</AccordionTrigger>
        <AccordionContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-8 px-2">

                    {/* Left side - Controls and description */}
                    <div className="space-y-6 w-5/12">

                      <div>
                        {/* Commented out section for custom image upload functionality */}

                        {/* Header with title and description */}
                        <TextureCardHeader className="flex w-full !py-2 text-center sm:text-start sm:block">
                          <div className="w-full">
                            <GradientHeading variant={"black"} size="sm" className="!text-black">{t('artworkDetail.remixArtwork')}</GradientHeading>
                            <p className='text-sm'>{t('artworkDetail.remixDescription')}</p>
                          </div>
                        </TextureCardHeader>

                      </div>

                      {/* Creativity slider control */}
                      <div className='space-y-3'>
                        <Label htmlFor="creativity-slider">{t('artworkDetail.creativity')}: {creativity}%</Label>
                        <Slider
                          id="creativity-slider"
                          value={[creativity]}
                          onValueChange={(value) => setCreativity(value[0])}
                          min={10}
                          max={100}
                          step={10}
                          className="mt-2"
                        />
                      </div>

                      <div className='space-y-3 hidden'>
                        <Label htmlFor="creativity-slider">Type</Label>
                        <Select
                          value={type}
                          onValueChange={(value) => setType(value)}
                        >
                          <SelectTrigger
                              className="focus:ring-0 text-[#4A4A4A] bg-transparent hover:bg-transparent"
                          >
                              <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent className='bg-white'>
                              <SelectItem value="Ordinary" className='hover:bg-gray-100 hover:text-[#000000] cursor-pointer'>Ordinary</SelectItem>
                              <SelectItem value="duplicate" className='hover:bg-gray-100 hover:text-[#000000] cursor-pointer'>Marketplace</SelectItem>
                              <SelectItem value="duplicatefree" className='hover:bg-gray-100 hover:text-[#000000] cursor-pointer'>Cyberport Free</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Commented out intensity slider control */}

                      <p>{t('artworkDetail.credits')}</p> {/* Placeholder for credits display */}
                      {/* Generate button for preview (separate from actual submission) */}
                      <Button onClick={handleRemix} className="w-full" variant={"outline"}>{t('artworkDetail.generateRemixedArt')}</Button>

                      {/* Commented out section for displaying preview images */}
                    </div>

                    {/* Commented out form fields for custom style input */}
                    {/* Commented out static style selection grid */}

                    {/* Right side - Style selection grid */}
                    <FormField
                      control={form.control}
                      name="styleName"
                      render={({ field }) => {
                        // Find the currently selected style
                        const currentStyle = STYLES_SAI.find(style => style.name === field.value);

                        return (
                          <FormItem className="flex-1 space-y-3">
                            <FormLabel>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-xl">
                                    {t('artworkDetail.selectStyle')}
                                  </h2>
                                  <p className='text-sm font-light'>{STYLES_SAI.length} {t('artworkDetail.availableStyles')}</p>
                                </div>
                                {/* Currently selected style label */}
                                {currentStyle && (
                                  <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-md">
                                    <span className="text-sm font-semibold">
                                      {t('artworkDetail.currentlySelected')}:
                                    </span>
                                    <span className="text-sm font-bold">
                                      {t('styles.' + currentStyle.label)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </FormLabel>
                            <FormControl>
                            {/* Grid of style options with images */}
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[340px] custom-scrollbar pr-2">
                              {STYLES_SAI.map((style) => (
                                <div key={style.name} className="h-full !p-0 relative">
                                  <FormItem className="h-full">
                                    <FormControl>
                                      <RadioGroupItem value={style.name} id={style.name} className="sr-only peer" />
                                    </FormControl>

                                    {/* Image container as direct sibling to FormControl */}
                                    <div className="relative w-full h-36 rounded-md     border-2 border-gray-200 overflow-hidden 
                                    /* CHECKED STATE STYLES */
                                    peer-data-[state=checked]:border-[4px] 
                                    peer-data-[state=checked]:border-transparent 
                                    peer-data-[state=checked]:bg-gradient-to-br 
                                    peer-data-[state=checked]:from-purple-600 
                                    peer-data-[state=checked]:to-pink-600 
                                    peer-data-[state=checked]:bg-origin-border 
                                    peer-data-[state=checked]:animate-pulse 
                                    transition-all">  
                                      <FormLabel htmlFor={style.name} className="cursor-pointer block w-full h-full">
                                        <Image src={`/artStyles/${style.image}`} alt={style.name} fill className="object-cover" />
                                      </FormLabel>
                                      <Badge className="text-white bg-[#2F2F31] absolute bottom-2 left-1/2 -translate-x-1/2 z-10 text-sm pointer-events-none whitespace-nowrap">
                                      {t('styles.'+style.label)}
                                      </Badge>
                                    </div>
                                  </FormItem>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        );
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </AccordionContent>
      </AccordionItem >
    </Accordion >
  )
}